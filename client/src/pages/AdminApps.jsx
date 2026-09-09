import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Globe, 
  ExternalLink, 
  Search, 
  Check, 
  AlertCircle,
  Layers,
  Palette,
  CheckCircle2,
  XCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { AppsService, UsersService, GroupsService } from '../services/api';
import { Button } from '../components/Button';
import { Input, Textarea, Select } from '../components/FormElements';
import { Modal } from '../components/Modal';

const AVAILABLE_ICONS = [
  'Globe', 'ShieldCheck', 'Truck', 'HardHat', 'Layers', 'FileText', 
  'BarChart3', 'Database', 'Settings', 'Package', 'Wrench', 'Building2',
  'Cpu', 'CreditCard', 'FileSpreadsheet', 'Activity', 'Lock', 'Bell'
];

const PRESET_COLORS = [
  '#0d2c5c', '#e40521', '#10b981', '#f59e0b', '#6366f1', '#06b6d4', '#8b5cf6', '#3b82f6'
];

export const AdminApps = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Estados para Modal App (Crear / Editar)
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [iconMode, setIconMode] = useState('flat'); // 'flat' | 'custom' | 'none'
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    icono: 'Globe',
    categoria: 'General',
    color: '#0d2c5c',
    orden: 0,
    activo: 1
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para Modal de Asignaciones
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAppForAssign, setSelectedAppForAssign] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [assignedUsersMap, setAssignedUsersMap] = useState({}); // { [userId]: 'acceso' | 'solo_ver' }
  const [assignedGroupsMap, setAssignedGroupsMap] = useState({}); // { [groupId]: 'acceso' | 'solo_ver' }
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await AppsService.getAll();
      setApps(res.data.apps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const openCreateModal = () => {
    setEditingApp(null);
    setIconMode('flat');
    setFormData({
      nombre: '',
      descripcion: '',
      url: '',
      icono: 'Globe',
      categoria: 'General',
      color: '#0d2c5c',
      orden: apps.length + 1,
      activo: 1,
      requiere_seguridad: 1
    });
    setFormError(null);
    setIsAppModalOpen(true);
  };

  const openEditModal = (app) => {
    setEditingApp(app);
    let mode = 'none';
    if (app.icono) {
      if (app.icono.startsWith('data:image/') || app.icono.startsWith('http')) {
        mode = 'custom';
      } else {
        mode = 'flat';
      }
    }
    setIconMode(mode);
    setFormData({
      nombre: app.nombre,
      descripcion: app.descripcion || '',
      url: app.url,
      icono: app.icono || '',
      categoria: app.categoria || 'General',
      color: app.color || '#0d2c5c',
      orden: app.orden || 0,
      activo: app.activo ? 1 : 0,
      requiere_seguridad: app.requiere_seguridad !== undefined ? (app.requiere_seguridad ? 1 : 0) : 1
    });
    setFormError(null);
    setIsAppModalOpen(true);
  };

  // Subida de imagen PNG y compresión a canvas 128x128 en Base64 para MySQL
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('El archivo debe ser una imagen (PNG, SVG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Data = canvas.toDataURL('image/png');

        setFormData(prev => ({ ...prev, icono: base64Data }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveApp = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validación básica de URL
    if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
      setFormError('La URL debe comenzar con http:// o https://');
      return;
    }

    // Ajuste de icono según iconMode
    let finalIcon = formData.icono;
    if (iconMode === 'none') {
      finalIcon = null;
    }

    try {
      setSubmitting(true);
      const payload = { ...formData, icono: finalIcon };
      if (editingApp) {
        await AppsService.update(editingApp.id, payload);
      } else {
        await AppsService.create(payload);
      }
      setIsAppModalOpen(false);
      fetchApps();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || 'Error al guardar aplicación.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteApp = async (app) => {
    if (!window.confirm(`¿Estás seguro de eliminar la aplicación "${app.nombre}"? Esta acción se registrará en la auditoría inmutable.`)) {
      return;
    }

    try {
      await AppsService.delete(app.id);
      fetchApps();
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const openAssignModal = async (app) => {
    if (app.requiere_seguridad === 0) {
      return;
    }
    setSelectedAppForAssign(app);
    setIsAssignModalOpen(true);
    setLoadingAssignments(true);

    try {
      const [assignRes, usersRes, groupsRes] = await Promise.all([
        AppsService.getAssignments(app.id),
        UsersService.getAll(),
        GroupsService.getAll()
      ]);

      setAllUsers(usersRes.data.users || []);
      setAllGroups(groupsRes.data.groups || []);

      const uMap = {};
      (assignRes.data.users || []).forEach(u => {
        uMap[u.id] = u.tipo_permiso || 'acceso';
      });
      setAssignedUsersMap(uMap);

      const gMap = {};
      (assignRes.data.groups || []).forEach(g => {
        gMap[g.id] = g.tipo_permiso || 'acceso';
      });
      setAssignedGroupsMap(gMap);
    } catch (err) {
      console.error(err);
      alert('Error al cargar datos de asignación');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleSaveAssignments = async () => {
    try {
      setSubmitting(true);
      const userAssignments = Object.entries(assignedUsersMap).map(([id, tipo_permiso]) => ({
        id: parseInt(id, 10),
        tipo_permiso
      }));
      const groupAssignments = Object.entries(assignedGroupsMap).map(([id, tipo_permiso]) => ({
        id: parseInt(id, 10),
        tipo_permiso
      }));

      await AppsService.saveAssignments(selectedAppForAssign.id, {
        userAssignments,
        groupAssignments
      });
      setIsAssignModalOpen(false);
      fetchApps();
    } catch (err) {
      alert('Error al guardar asignaciones: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApps = apps.filter(a =>
    a.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (a.url && a.url.toLowerCase().includes(search.toLowerCase())) ||
    (a.categoria && a.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            Gestor de <span style={{ color: 'var(--secondary)' }}>Aplicaciones</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Administra el catálogo de sistemas corporativos, sube iconos personalizados o flat y asigna permisos.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Nueva Aplicación
        </Button>
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Buscar app por nombre, url o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 42px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
            fontSize: '0.88rem'
          }}
        />
      </div>

      {/* Tabla de Aplicaciones */}
      <div className="table-container">
        <table className="dy-table" style={{ width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '220px', width: '30%' }}>Aplicación</th>
              <th style={{ width: '100px' }}>Categoría</th>
              <th style={{ width: '180px' }}>Enlace Destino (URL)</th>
              <th style={{ width: '160px' }}>Asignaciones</th>
              <th style={{ width: '85px' }}>Accesos</th>
              <th style={{ width: '90px' }}>Estado</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                  Cargando catálogo...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No hay aplicaciones registradas que coincidan.
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => {
                const isCustomImage = app.icono && (app.icono.startsWith('data:image/') || app.icono.startsWith('http'));
                const LucideComp = app.icono && Icons[app.icono] ? Icons[app.icono] : null;
                const appColor = app.color && app.color.trim().startsWith('#') ? app.color.trim() : '#0d2c5c';

                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: `linear-gradient(135deg, ${appColor}18 0%, ${appColor}32 100%)`,
                            border: `2px solid ${appColor}`,
                            color: appColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: `0 2px 6px ${appColor}20`,
                            flexShrink: 0
                          }}
                        >
                          {isCustomImage ? (
                            <img src={app.icono} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                          ) : LucideComp ? (
                            <LucideComp size={20} />
                          ) : (
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: appColor }}>{app.nombre[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{app.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Orden: {app.orden}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ whiteSpace: 'nowrap' }}>{app.categoria}</span>
                    </td>
                    <td>
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={app.url}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.url}</span>
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                      </a>
                    </td>
                    <td>
                      {app.requiere_seguridad === 0 ? (
                        <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                          Pública (Todos)
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          <span className="badge badge-primary" style={{ whiteSpace: 'nowrap' }}>
                            {app.total_usuarios || 0} usuarios
                          </span>
                          <span className="badge" style={{ background: 'var(--surface-hover)', whiteSpace: 'nowrap' }}>
                            {app.total_grupos || 0} grupos
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-warning" style={{ fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-block' }}>
                        {app.total_accesos || 0} clics
                      </span>
                    </td>
                    <td>
                      {app.activo ? (
                        <span className="badge badge-success" style={{ whiteSpace: 'nowrap' }}>
                          <CheckCircle2 size={11} /> Activo
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ whiteSpace: 'nowrap' }}>
                          <XCircle size={11} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {app.requiere_seguridad !== 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Users}
                            onClick={() => openAssignModal(app)}
                            title="Gestionar Asignaciones"
                          >
                            Asignar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit}
                          onClick={() => openEditModal(app)}
                          title="Editar"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteApp(app)}
                          title="Eliminar"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Crear / Editar Aplicación */}
      <Modal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        title={editingApp ? `Editar Aplicación: ${editingApp.nombre}` : 'Nueva Aplicación'}
        maxWidth="640px"
      >
        <form onSubmit={handleSaveApp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--error)',
                borderRadius: 'var(--radius)',
                color: 'var(--error)',
                fontSize: '0.85rem'
              }}
            >
              {formError}
            </div>
          )}

          <Input
            label="Nombre del Sistema / Aplicación"
            placeholder="Ej: CIE - Control de Ingresos y Egresos"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />

          <Textarea
            label="Descripción"
            placeholder="Breve detalle de la funcionalidad o propósito del sistema..."
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />

          <Input
            label="URL de Destino (Soporta HTTP, HTTPS, IP, puertos y query params)"
            placeholder="https://cie.donyeyo.com.ar o http://192.168.1.150:8080/shigma?m=1"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            helperText="Ejemplo: https://intranet.donyeyo.com.ar, http://192.168.1.10:3000/app"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Categoría"
              placeholder="Ej: Producción, Logística, Seguridad"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            />

            <Input
              label="Orden de Visualización"
              type="number"
              value={formData.orden}
              onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value || 0, 10) })}
            />
          </div>

          {/* Selector de Modo de Icono (Opcional, Flat o PNG Base64) */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Icono de la Aplicación (Opcional - Guardado en Base de Datos)
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setIconMode('flat');
                  if (!formData.icono || formData.icono.startsWith('data:')) {
                    setFormData({ ...formData, icono: 'Globe' });
                  }
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${iconMode === 'flat' ? 'var(--primary)' : 'var(--border)'}`,
                  background: iconMode === 'flat' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: iconMode === 'flat' ? 'var(--btn-primary-text)' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Icono Flat del Sistema
              </button>
              <button
                type="button"
                onClick={() => {
                  setIconMode('custom');
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${iconMode === 'custom' ? 'var(--primary)' : 'var(--border)'}`,
                  background: iconMode === 'custom' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: iconMode === 'custom' ? 'var(--btn-primary-text)' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Upload size={14} />
                <span>Subir PNG / Imagen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIconMode('none');
                  setFormData({ ...formData, icono: '' });
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${iconMode === 'none' ? 'var(--primary)' : 'var(--border)'}`,
                  background: iconMode === 'none' ? 'var(--btn-primary-bg)' : 'transparent',
                  color: iconMode === 'none' ? 'var(--btn-primary-text)' : 'var(--text)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Sin Icono
              </button>
            </div>

            {/* Subida personalizada de PNG */}
            {iconMode === 'custom' && (
              <div style={{ padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivo PNG
                </Button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  Se redimensionará y guardará directamente en la base de datos MySQL como Base64.
                </span>

                {formData.icono && formData.icono.startsWith('data:') && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vista Previa:</span>
                    <img
                      src={formData.icono}
                      alt="Preview"
                      style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'var(--surface-hover)', borderRadius: '8px', padding: '4px' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Grilla Flat Icons */}
            {iconMode === 'flat' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '8px' }}>
                {AVAILABLE_ICONS.map((iconName) => {
                  const Comp = Icons[iconName] || Icons.Globe;
                  const isSelected = formData.icono === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setFormData({ ...formData, icono: iconName })}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--btn-primary-bg)' : 'var(--surface)',
                        color: isSelected ? 'var(--btn-primary-text)' : 'var(--text)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={iconName}
                    >
                      <Comp size={18} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selector de Color */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Color Distintivo
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: c,
                    border: formData.color === c ? '3px solid #ffffff' : 'none',
                    boxShadow: formData.color === c ? '0 0 0 2px var(--primary)' : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Switch Requiere Seguridad */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '6px' }}>
            <input
              type="checkbox"
              id="app-seguridad"
              checked={!formData.requiere_seguridad}
              onChange={(e) => setFormData({ ...formData, requiere_seguridad: e.target.checked ? 0 : 1 })}
              style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
            />
            <div>
              <label htmlFor="app-seguridad" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'block' }}>
                No requiere seguridad (Pública para todos los usuarios)
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Si se marca, todos los usuarios la verán en su tablero con acceso directo sin requerir asignaciones individuales o de grupos.
              </span>
            </div>
          </div>

          {/* Switch Activo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="app-activo"
              checked={!!formData.activo}
              onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="app-activo" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Aplicación activa (visible para los usuarios autorizados)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="outline" onClick={() => setIsAppModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingApp ? 'Guardar Cambios' : 'Crear Aplicación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Asignación a Usuarios y Grupos */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Asignar Accesos: ${selectedAppForAssign?.nombre || ''}`}
        maxWidth="680px"
      >
        {loadingAssignments ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>Cargando datos de asignación...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Sección Grupos */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                Grupos con Acceso Directo
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Todos los usuarios miembros de los grupos seleccionados verán este botón en su tablero.
              </p>
              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {allGroups.map((group) => {
                  const isChecked = !!assignedGroupsMap[group.id];
                  const currentTipo = assignedGroupsMap[group.id] || 'acceso';
                  return (
                    <div
                      key={group.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isChecked ? 'var(--surface-hover)' : 'transparent',
                        gap: '10px'
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = { ...assignedGroupsMap };
                            if (e.target.checked) {
                              updated[group.id] = 'acceso';
                            } else {
                              delete updated[group.id];
                            }
                            setAssignedGroupsMap(updated);
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{group.nombre}</span>
                        {group.descripcion && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ({group.descripcion})
                          </span>
                        )}
                      </label>

                      {isChecked && (
                        <select
                          value={currentTipo}
                          onChange={(e) => {
                            setAssignedGroupsMap({
                              ...assignedGroupsMap,
                              [group.id]: e.target.value
                            });
                          }}
                          style={{
                            fontSize: '0.78rem',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            border: '1px solid var(--border)',
                            background: 'var(--surface)',
                            color: currentTipo === 'acceso' ? 'var(--success)' : 'var(--secondary)',
                            fontWeight: 700
                          }}
                        >
                          <option value="acceso">Puede acceder</option>
                          <option value="solo_ver">Sólo ver</option>
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección Usuarios Específicos */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                Usuarios Particulares con Acceso Directo
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Asignación individual para personas específicas independientemente de su grupo.
              </p>
              <div
                style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {allUsers.map((u) => {
                  const isChecked = !!assignedUsersMap[u.id];
                  const currentTipo = assignedUsersMap[u.id] || 'acceso';
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isChecked ? 'var(--surface-hover)' : 'transparent',
                        gap: '10px'
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = { ...assignedUsersMap };
                            if (e.target.checked) {
                              updated[u.id] = 'acceso';
                            } else {
                              delete updated[u.id];
                            }
                            setAssignedUsersMap(updated);
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{u.nombre}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </label>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isChecked && (
                          <select
                            value={currentTipo}
                            onChange={(e) => {
                              setAssignedUsersMap({
                                ...assignedUsersMap,
                                [u.id]: e.target.value
                              });
                            }}
                            style={{
                              fontSize: '0.78rem',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: currentTipo === 'acceso' ? 'var(--success)' : 'var(--secondary)',
                              fontWeight: 700
                            }}
                          >
                            <option value="acceso">Puede acceder</option>
                            <option value="solo_ver">Sólo ver</option>
                          </select>
                        )}
                        <span className={`badge ${u.rol === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                          {u.rol}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveAssignments} loading={submitting}>
                Guardar Asignaciones
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
