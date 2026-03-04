import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, Warehouse, UserRole } from '../../types/database';
import { Users as UsersIcon, Plus, CreditCard as Edit2, Trash2, X, Check } from 'lucide-react';

interface ProfileWithWarehouses extends Profile {
  warehouses: Warehouse[];
}

export default function Users() {
  const [profiles, setProfiles] = useState<ProfileWithWarehouses[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('operations');
  const [newWarehouseIds, setNewWarehouseIds] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<UserRole>('operations');
  const [editWarehouseIds, setEditWarehouseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    const { data } = await supabase.from('warehouses').select('*').order('name');
    if (data) {
      setAllWarehouses(data);
    }
  };

  const loadUsers = async () => {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesData) {
      const profilesWithWarehouses = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: userWarehousesData } = await supabase
            .from('user_warehouses')
            .select('warehouse_id')
            .eq('user_id', profile.id);

          let warehouses: Warehouse[] = [];
          if (userWarehousesData && userWarehousesData.length > 0) {
            const warehouseIds = userWarehousesData.map((uw) => uw.warehouse_id);
            const { data: warehousesData } = await supabase
              .from('warehouses')
              .select('*')
              .in('id', warehouseIds);

            if (warehousesData) {
              warehouses = warehousesData;
            }
          }

          return { ...profile, warehouses };
        })
      );
      setProfiles(profilesWithWarehouses);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        data: {
          full_name: newFullName,
        },
      },
    });

    if (authError || !authData.user) {
      alert('Erreur lors de la création de l\'utilisateur: ' + (authError?.message || 'Unknown error'));
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: newFullName, role: newRole })
      .eq('id', authData.user.id);

    if (profileError) {
      alert('Erreur lors de la mise à jour du profil');
      setLoading(false);
      return;
    }

    if (newWarehouseIds.length > 0) {
      const userWarehouses = newWarehouseIds.map((warehouseId) => ({
        user_id: authData.user.id,
        warehouse_id: warehouseId,
      }));

      await supabase.from('user_warehouses').insert(userWarehouses);
    }

    setNewEmail('');
    setNewPassword('');
    setNewFullName('');
    setNewRole('operations');
    setNewWarehouseIds([]);
    setShowCreateForm(false);
    setLoading(false);
    loadUsers();
  };

  const handleUpdateUser = async (profileId: string) => {
    setLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: editRole })
      .eq('id', profileId);

    if (profileError) {
      alert('Erreur lors de la mise à jour du rôle');
      setLoading(false);
      return;
    }

    await supabase.from('user_warehouses').delete().eq('user_id', profileId);

    if (editWarehouseIds.length > 0) {
      const userWarehouses = editWarehouseIds.map((warehouseId) => ({
        user_id: profileId,
        warehouse_id: warehouseId,
      }));

      await supabase.from('user_warehouses').insert(userWarehouses);
    }

    setEditingProfile(null);
    setEditRole('operations');
    setEditWarehouseIds([]);
    setLoading(false);
    loadUsers();
  };

  const handleDeleteUser = async (profileId: string, email: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${email}?`)) {
      setLoading(true);
      await supabase.from('user_warehouses').delete().eq('user_id', profileId);
      await supabase.from('profiles').delete().eq('id', profileId);
      setLoading(false);
      loadUsers();
    }
  };

  const startEdit = (profile: ProfileWithWarehouses) => {
    setEditingProfile(profile.id);
    setEditRole(profile.role);
    setEditWarehouseIds(profile.warehouses.map((w) => w.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          disabled={loading}
        >
          <Plus className="w-5 h-5" />
          Créer un utilisateur
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                >
                  <option value="operations">Operations</option>
                  <option value="chef_agence">Chef d'agence</option>
                  <option value="regional">Regional</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entrepôts assignés</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                {allWarehouses.map((warehouse) => (
                  <label key={warehouse.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWarehouseIds.includes(warehouse.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWarehouseIds([...newWarehouseIds, warehouse.id]);
                        } else {
                          setNewWarehouseIds(newWarehouseIds.filter((id) => id !== warehouse.id));
                        }
                      }}
                      className="rounded"
                      disabled={loading}
                    />
                    <span className="text-sm">{warehouse.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                disabled={loading}
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEmail('');
                  setNewPassword('');
                  setNewFullName('');
                  setNewRole('operations');
                  setNewWarehouseIds([]);
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {profiles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <UsersIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrepôts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{profile.full_name || 'Sans nom'}</div>
                        <div className="text-sm text-gray-500">{profile.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingProfile === profile.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="px-2 py-1 border border-gray-300 rounded"
                          disabled={loading}
                        >
                          <option value="operations">Operations</option>
                          <option value="chef_agence">Chef d'agence</option>
                          <option value="regional">Regional</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      ) : (
                        <span className="text-gray-700">{profile.role}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingProfile === profile.id ? (
                        <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto p-2 border border-gray-300 rounded">
                          {allWarehouses.map((warehouse) => (
                            <label key={warehouse.id} className="flex items-center gap-1 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={editWarehouseIds.includes(warehouse.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditWarehouseIds([...editWarehouseIds, warehouse.id]);
                                  } else {
                                    setEditWarehouseIds(editWarehouseIds.filter((id) => id !== warehouse.id));
                                  }
                                }}
                                className="rounded"
                                disabled={loading}
                              />
                              <span>{warehouse.code}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700">
                          {profile.warehouses.length > 0
                            ? profile.warehouses.map((w) => w.code).join(', ')
                            : 'Aucun'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {editingProfile === profile.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(profile.id)}
                              className="text-green-600 hover:text-green-700"
                              disabled={loading}
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProfile(null);
                                setEditRole('operations');
                                setEditWarehouseIds([]);
                              }}
                              className="text-red-600 hover:text-red-700"
                              disabled={loading}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(profile)}
                              className="text-blue-600 hover:text-blue-700"
                              disabled={loading}
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(profile.id, profile.email || '')}
                              className="text-red-600 hover:text-red-700"
                              disabled={loading}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
