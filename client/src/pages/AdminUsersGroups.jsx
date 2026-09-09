import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  XCircle,
  Search
} from 'lucide-react';
import { UsersService, GroupsService, AppsService } from '../services/api';
import { Button } from '../components/Button';
import { Input, Textarea, Select } from '../components/FormElements';
import { Modal } from '../components/Modal';

export const AdminUsersGroups = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'groups'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales de Usuario
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ email: '', nombre: '', rol: 'user', groupIds: [] });
  const [userError, setUserError] = useState(null);

  const [isUserAppsModalOpen, setIsUserAppsModalOpen] = useState(false);
  const [selectedUserForApps, setSelectedUserForApps] = useState(null);
  const [assignedAppIdsForUser, setAssignedAppIdsForUser] = useState([]);

  // Modales de Grupo
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ nombre: '', descripcion: '' });
  const [groupError, setGroupError] = useState(null);

  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [groupAppIds, setGroupAppIds] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, groupsRes, appsRes] = await Promise.all([
        UsersService.getAll(),
        GroupsService.getAll(),
        AppsService.getAll()
      ]);
      setUsers(usersRes.data.users || []);
      setGroups(groupsRes.data.groups || []);
      setApps(appsRes.data.apps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers Usuarios ---
  const handleToggleUserRole = async (user) => {
    const newRole = user.rol === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`¿Cambiar rol de ${user.nombre} a "${newRole}"?`)) return;

    try {
      await UsersService.updateRole(user.id, newRole);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleUserStatus = async (user) => {
    const newStatus = user.activo ? 0 : 1;
    try {
      await UsersService.updateStatus(user.id, newStatus);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError(null);
    try {
      setSubmitting(true);
      await UsersService.create(newUserForm);
      setIsNewUserModalOpen(false);
      setNewUserForm({ email: '', nombre: '', rol: 'user', groupIds: [] });
      fetchData();
    } catch (err) {
      setUserError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openUserAppsModal = async (user) => {
    setSelectedUserForApps(user);
    setIsUserAppsModalOpen(true);
    try {
      const res = await UsersService.getUserApps(user.id);
      setAssignedAppIdsForUser((res.data.apps || []).map(a => a.id));
    } catch (err) {
      alert('Error al cargar apps del usuario: ' + err.message);
    }
  };

  const handleSaveUserApps = async () => {
    try {
      setSubmitting(true);
      await UsersService.saveUserApps(selectedUserForApps.id, assignedAppIdsForUser);
      setIsUserAppsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error al guardar apps: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers Grupos ---
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    setGroupError(null);
    try {
      setSubmitting(true);
      if (editingGroup) {
        await GroupsService.update(editingGroup.id, groupForm);
      } else {
        await GroupsService.create(groupForm);
      }
      setIsGroupModalOpen(false);
      fetchData();
    } catch (err) {
      setGroupError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`¿Eliminar grupo "${group.nombre}"? Esta acción se auditará automáticamente.`)) return;
    try {
      await GroupsService.delete(group.id);
      fetchData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const openGroupMembersModal = async (group) => {
    setSelectedGroup(group);
    setIsGroupMembersModalOpen(true);
    try {
      const res = await GroupsService.getDetails(group.id);
      setGroupMemberIds((res.data.members || []).map(m => m.id));
      setGroupAppIds((res.data.apps || []).map(a => a.id));
    } catch (err) {
      alert('Error al cargar miembros del grupo: ' + err.message);
    }
  };

  const handleSaveGroupDetails = async () => {
    try {
      setSubmitting(true);
      await Promise.all([
        GroupsService.saveMembers(selectedGroup.id, groupMemberIds),
        GroupsService.saveApps(selectedGroup.id, groupAppIds)
      ]);
      setIsGroupMembersModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Error al guardar configuración del grupo: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            Usuarios y <span style={{ color: 'var(--secondary)' }}>Grupos</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Control de roles, asignación de personas a grupos corporativos y permisos a la botonera.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'users' ? (
            <Button variant="primary" icon={Plus} onClick={() => setIsNewUserModalOpen(true)}>
              Nuevo Usuario
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => {
                setEditingGroup(null);
                setGroupForm({ nombre: '', descripcion: '' });
                setIsGroupModalOpen(true);
              }}
            >
              Nuevo Grupo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'users' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'users' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <User size={18} />
          <span>Usuarios ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            borderBottom: activeTab === 'groups' ? '3px solid var(--primary)' : '3px solid transparent',
            background: 'transparent',
            color: activeTab === 'groups' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'groups' ? 700 : 500,
            fontSize: '0.95rem',
            cursor: 'pointer'
          }}
        >
          <Users size={18} />
          <span>Grupos Corporativos ({groups.length})</span>
        </button>
      </div>

      {/* Pestaña: USUARIOS */}
      {activeTab === 'users' && (
        <div className="table-container">
          <table className="dy-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Grupos Pertenecientes</th>
                <th>Apps Directas</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const gruposList = Array.isArray(u.grupos) ? u.grupos : [];
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{u.nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUserRole(u)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Haz clic para alternar rol"
                      >
                        <span className={`badge ${u.rol === 'admin' ? 'badge-danger' : 'badge-primary'}`}>
                          {u.rol === 'admin' ? <Shield size={12} /> : <User size={12} />}
                          {u.rol}
                        </span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {gruposList.length > 0 ? (
                          gruposList.map((g, idx) => (
                            <span key={idx} className="badge" style={{ background: 'var(--surface-hover)' }}>
                              {g.nombre}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin grupo</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {u.total_apps_directas || 0} apps
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="Haz clic para activar/desactivar"
                      >
                        {u.activo ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={12} /> Activo
                          </span>
                        ) : (
                          <span className="badge badge-danger">
                            <XCircle size={12} /> Inactivo
                          </span>
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Layers}
                        onClick={() => openUserAppsModal(u)}
                      >
                        Asignar Apps
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pestaña: GRUPOS */}
      {activeTab === 'groups' && (
        <div className="table-container">
          <table className="dy-table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Descripción</th>
                <th>Miembros</th>
                <th>Apps Asignadas</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{g.nombre}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {g.descripcion || 'Sin descripción'}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{g.total_usuarios || 0} usuarios</span>
                  </td>
                  <td>
                    <span className="badge badge-warning">{g.total_apps || 0} aplicaciones</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Users}
                        onClick={() => openGroupMembersModal(g)}
                      >
                        Gestionar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => {
                          setEditingGroup(g);
                          setGroupForm({ nombre: g.nombre, descripcion: g.descripcion || '' });
                          setIsGroupModalOpen(true);
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDeleteGroup(g)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Crear Usuario Manual */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Dar de Alta Usuario"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {userError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>
              {userError}
            </div>
          )}
          <Input
            label="Correo Electrónico (@donyeyo.com.ar)"
            type="email"
            placeholder="usuario@donyeyo.com.ar"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            required
          />
          <Input
            label="Nombre Completo"
            placeholder="Juan Pérez"
            value={newUserForm.nombre}
            onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
          />
          <Select
            label="Rol de Usuario"
            value={newUserForm.rol}
            onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
            options={[
              { label: 'Usuario Estándar', value: 'user' },
              { label: 'Administrador del Sistema', value: 'admin' }
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setIsNewUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Guardar Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Asignar Apps a Usuario Particular */}
      <Modal
        isOpen={isUserAppsModalOpen}
        onClose={() => setIsUserAppsModalOpen(false)}
        title={`Apps Directas para ${selectedUserForApps?.nombre || ''}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Selecciona las aplicaciones que este usuario podrá visualizar en su tablero de forma individual.
          </p>
          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px' }}>
            {apps.map((app) => {
              const isChecked = assignedAppIdsForUser.includes(app.id);
              return (
                <label key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignedAppIdsForUser([...assignedAppIdsForUser, app.id]);
                      } else {
                        setAssignedAppIdsForUser(assignedAppIdsForUser.filter(id => id !== app.id));
                      }
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{app.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.categoria} &bull; {app.url}</div>
                  </div>
                </label>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="outline" onClick={() => setIsUserAppsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveUserApps} loading={submitting}>
              Guardar Apps
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Crear / Editar Grupo */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title={editingGroup ? `Editar Grupo: ${editingGroup.nombre}` : 'Nuevo Grupo Corporativo'}
      >
        <form onSubmit={handleSaveGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius)' }}>
              {groupError}
            </div>
          )}
          <Input
            label="Nombre del Grupo"
            placeholder="Ej: Supervisores de Planta"
            value={groupForm.nombre}
            onChange={(e) => setGroupForm({ ...groupForm, nombre: e.target.value })}
            required
          />
          <Textarea
            label="Descripción del Grupo"
            placeholder="Personal a cargo del turno de elaboración..."
            value={groupForm.descripcion}
            onChange={(e) => setGroupForm({ ...groupForm, descripcion: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Guardar Grupo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gestionar Miembros y Apps del Grupo */}
      <Modal
        isOpen={isGroupMembersModalOpen}
        onClose={() => setIsGroupMembersModalOpen(false)}
        title={`Configurar Grupo: ${selectedGroup?.nombre || ''}`}
        maxWidth="640px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Miembros del Grupo</h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px' }}>
              {users.map((u) => {
                const isMember = groupMemberIds.includes(u.id);
                return (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isMember}
                      onChange={(e) => {
                        if (e.target.checked) setGroupMemberIds([...groupMemberIds, u.id]);
                        else setGroupMemberIds(groupMemberIds.filter(id => id !== u.id));
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{u.nombre} ({u.email})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Aplicaciones Asignadas al Grupo</h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px' }}>
              {apps.map((a) => {
                const hasApp = groupAppIds.includes(a.id);
                return (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasApp}
                      onChange={(e) => {
                        if (e.target.checked) setGroupAppIds([...groupAppIds, a.id]);
                        else setGroupAppIds(groupAppIds.filter(id => id !== a.id));
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{a.nombre}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button variant="outline" onClick={() => setIsGroupMembersModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveGroupDetails} loading={submitting}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
