import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { InventoryItem } from '@/src/types';
import { Plus, Search, Package, AlertTriangle, ArrowRight, Zap, Layers, Cpu, ArrowUpDown, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newProductName, setNewProductName] = useState('');

  useEffect(() => {
    const qCategories = query(collection(db, 'inventoryCategories'), orderBy('name', 'asc'));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    const qProducts = query(collection(db, 'inventoryProducts'), orderBy('name', 'asc'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'inventoryCategories'), { name: newCategoryName.trim() });
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    try {
      await addDoc(collection(db, 'inventoryProducts'), { name: newProductName.trim() });
      setNewProductName('');
      setIsProductModalOpen(false);
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [newItem, setNewItem] = useState({ name: '', category: 'Solar Panels', quantity: 0, unit: 'Units', minThreshold: 10, serialNumber: '', warranty: '', vendor: '' });

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItemId) {
        await updateDoc(doc(db, 'inventory', editingItemId), {
          ...newItem,
          lastUpdated: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...newItem,
          lastUpdated: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setEditingItemId(null);
      setNewItem({ name: '', category: 'Solar Panels', quantity: 0, unit: 'Units', minThreshold: 10, serialNumber: '', warranty: '', vendor: '' });
    } catch (err) {
      console.error('Error saving inventory item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch (err) {
        console.error('Error deleting inventory item:', err);
      }
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, 'inventory', id), { quantity: Math.max(0, newQuantity) });
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Solar Panels': return Zap;
      case 'Inverters': return Cpu;
      case 'Batteries': return Layers;
      default: return Package;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Warehouse Logistics</h1>
          <p className="text-slate-500 mt-1 font-medium">Real-time component tracking and supply chain management.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-5 h-5" />
          Provision Stock
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-emerald-100 opacity-20 transition-opacity group-hover:opacity-100">
            <Package className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Total Catalog</p>
              <h3 className="text-2xl font-black text-slate-900">{items.length} SKUs</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 text-amber-100 opacity-20 transition-opacity group-hover:opacity-100">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Critical Alerts</p>
              <h3 className="text-2xl font-black text-slate-900">
                {items.filter(item => item.quantity <= item.minThreshold).length} Low
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search components by SKU, category or site..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors shadow-sm">
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-6 py-4">Component Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Operational Status</th>
                <th className="px-6 py-4 text-right">Inventory Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const Icon = getCategoryIcon(item.category);
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-white transition-colors">
                          <Icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{item.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SKU-{item.id.slice(0,6).toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-600 border border-slate-200">
                        {item.category}
                      </span>
                      {item.vendor && <div className="text-[10px] text-slate-500 mt-1">Vendor: {item.vendor}</div>}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "font-black text-lg",
                        isLow ? "text-amber-600" : "text-slate-900"
                      )}>
                        {item.quantity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{item.unit}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              isLow ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(100, (item.quantity / (item.minThreshold * 2)) * 100)}%` }}
                          />
                        </div>
                        {isLow && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      </div>
                      {item.serialNumber && <div className="text-[10px] text-slate-500 mt-1">S/N: {item.serialNumber}</div>}
                      {item.warranty && <div className="text-[10px] text-slate-500">Warranty: {item.warranty}</div>}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm font-bold"
                          title="Decrease Quantity"
                        >
                          -
                        </button>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm font-bold"
                          title="Increase Quantity"
                        >
                          +
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => {
                            setEditingItemId(item.id);
                            setNewItem(item);
                            setIsModalOpen(true);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium text-sm">No items match your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{editingItemId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
              <button onClick={() => {setIsModalOpen(false); setEditingItemId(null); setNewItem({ name: '', category: 'Solar Panels', quantity: 0, unit: 'Units', minThreshold: 10, serialNumber: '', warranty: '', vendor: '' });}} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSubmitItem} className="p-6 space-y-4">
              <div>
                <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                  <span>Product Name</span>
                  <button type="button" onClick={() => setIsProductModalOpen(true)} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold">+ New Product</button>
                </label>
                {products.length > 0 ? (
                  <select 
                    required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white" 
                  >
                    <option value="" disabled>Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    required
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                    placeholder="No products available, type here or add one"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                    <span>Category</span>
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold">+ New</button>
                  </label>
                  <select 
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                  >
                    <option value="Solar Panels">Solar Panels</option>
                    <option value="Inverters">Inverters</option>
                    <option value="Batteries">Batteries</option>
                    <option value="Cables">Cables</option>
                    <option value="MC4 Connectors">MC4 Connectors</option>
                    <option value="Mounting Structures">Mounting Structures</option>
                    <option value="Junction Boxes">Junction Boxes</option>
                    <option value="Earthing Kits">Earthing Kits</option>
                    <option value="Lightning Arresters">Lightning Arresters</option>
                    <option value="Tools Inventory">Tools Inventory</option>
                    <option value="Other">Other</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input 
                    required
                    value={newItem.unit}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                    placeholder="e.g. Units, Meters"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Quantity</label>
                  <input 
                    type="number"
                    required
                    value={newItem.quantity || ''}
                    onChange={e => setNewItem({...newItem, quantity: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold</label>
                  <input 
                    type="number"
                    required
                    value={newItem.minThreshold || ''}
                    onChange={e => setNewItem({...newItem, minThreshold: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number (Optional)</label>
                  <input 
                    type="text"
                    value={newItem.serialNumber || ''}
                    onChange={e => setNewItem({...newItem, serialNumber: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Warranty (Optional)</label>
                  <input 
                    type="text"
                    value={newItem.warranty || ''}
                    onChange={e => setNewItem({...newItem, warranty: e.target.value})}
                    placeholder="e.g. 5 Years"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Supplier (Optional)</label>
                  <input 
                    type="text"
                    value={newItem.vendor || ''}
                    onChange={e => setNewItem({...newItem, vendor: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); setNewItem({ name: "", category: "Solar Panels", quantity: 0, unit: "Units", minThreshold: 10, serialNumber: "", warranty: "", vendor: "" }); setEditingItemId(null); }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-slate-900">New Category</h3>
               <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  required
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Transformers"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-bold text-slate-900">New Product</h3>
               <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input 
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  placeholder="e.g. Solar Panel 400W Mono"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
