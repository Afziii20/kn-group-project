import { useEffect, useState } from 'react'
import { getProducts, getCategories, getOrders, createProduct, createCategory, deleteProduct, deleteCategory, updateProduct, uploadProductImage } from './api'
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, LogOut, Package, Grid, ShoppingBag } from 'lucide-react'

export default function AdminDashboard({ onLogout }) {
    const [activeTab, setActiveTab] = useState('products')

    // Data States
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [orders, setOrders] = useState([])

    // Modal States
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

    // Form States
    const [editingProductId, setEditingProductId] = useState(null)
    const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stock: '', category_id: '' })
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

    const loadData = async () => {
        try {
            const [prodRes, catRes, ordRes] = await Promise.all([getProducts(), getCategories(), getOrders()])
            setProducts(prodRes)
            setCategories(catRes)
            setOrders(ordRes)
        } catch (error) {
            console.error("Data fetch failed", error)
        }
    }

    useEffect(() => { loadData() }, [])

    // --- IMAGE UPLOAD HANDLER ---
    const handleImageUpload = async (productId, e) => {
        const file = e.target.files[0]
        if (!file) return

            try {
                await uploadProductImage(productId, file)
                loadData() // Refresh table to show new image!
            } catch (error) {
                alert("Failed to upload image. Ensure it is a valid image file (jpg, png).")
            }
    }

    // --- PRODUCT SUBMIT (ADD OR EDIT) ---
    const handleProductSubmit = async (e) => {
        e.preventDefault()
        try {
            if (editingProductId) {
                await updateProduct(editingProductId, productForm)
            } else {
                await createProduct(productForm)
            }
            setIsProductModalOpen(false)
            loadData()
        } catch (error) {
            alert("Failed to save product.")
        }
    }

    const openAddProductModal = () => {
        setEditingProductId(null)
        setProductForm({ name: '', description: '', price: '', stock: '', category_id: categories[0]?.id || '' })
        setIsProductModalOpen(true)
    }

    const openEditProductModal = (product) => {
        setEditingProductId(product.id)
        setProductForm({
            name: product.name || product.title || '',
            description: product.description || '',
            price: product.price,
            stock: product.stock,
            category_id: product.category_id || ''
        })
        setIsProductModalOpen(true)
    }

    const handleCategorySubmit = async (e) => {
        e.preventDefault()
        try {
            await createCategory(categoryForm)
            setIsCategoryModalOpen(false)
            setCategoryForm({ name: '', description: '' })
            loadData()
        } catch (error) {
            alert("Failed to create category.")
        }
    }

    const handleDeleteProduct = async (id) => {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id)
            loadData()
        }
    }

    const handleDeleteCategory = async (id) => {
        if (confirm('Deleting a category might affect its products. Continue?')) {
            await deleteCategory(id)
            loadData()
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight"><span className="text-[#F39223]">KN</span> Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
        <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'products' ? 'bg-[#F39223]/10 text-[#F39223]' : 'text-gray-500 hover:bg-gray-100'}`}><Package size={20}/> Products</button>
        <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'categories' ? 'bg-[#F39223]/10 text-[#F39223]' : 'text-gray-500 hover:bg-gray-100'}`}><Grid size={20}/> Categories</button>
        <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'orders' ? 'bg-[#F39223]/10 text-[#F39223]' : 'text-gray-500 hover:bg-gray-100'}`}><ShoppingBag size={20}/> Orders</button>
        </nav>
        <div className="p-4 border-t border-gray-100">
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"><LogOut size={18}/> Logout</button>
        </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
            <div>
            <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">Products</h2>
            <button onClick={openAddProductModal} className="bg-[#1C1C1C] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#F39223] transition-colors"><Plus size={18}/> Add Product</button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
            <th className="p-4 font-bold border-b border-gray-100">Image</th>
            <th className="p-4 font-bold border-b border-gray-100">Name</th>
            <th className="p-4 font-bold border-b border-gray-100">Price</th>
            <th className="p-4 font-bold border-b border-gray-100">Stock</th>
            <th className="p-4 font-bold border-b border-gray-100 text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4">
                {p.image_url ? (
                    <img src={p.image_url} alt="product" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={20}/></div>
                )}
                </td>
                <td className="p-4 font-bold text-gray-900">{p.name || p.title}</td>
                <td className="p-4 text-gray-600 font-medium">₹{p.price.toLocaleString('en-IN')}</td>
                <td className="p-4 text-gray-600">{p.stock}</td>
                <td className="p-4 text-right flex items-center justify-end gap-2">

                {/* 1. UPLOAD IMAGE BUTTON (Hidden File Input) */}
                <label className="cursor-pointer p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Upload Image">
                <Upload size={18} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(p.id, e)} />
                </label>

                {/* 2. EDIT BUTTON */}
                <button onClick={() => openEditProductModal(p)} className="p-2 text-gray-400 hover:text-[#54A042] hover:bg-green-50 rounded-lg transition-colors" title="Edit">
                <Edit size={18}/>
                </button>

                {/* 3. DELETE BUTTON */}
                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                <Trash2 size={18}/>
                </button>

                </td>
                </tr>
            ))}
            </tbody>
            </table>
            {products.length === 0 && <p className="p-8 text-center text-gray-400 font-medium">No products found. Add your first product!</p>}
            </div>
            </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
            <div>
            <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">Categories</h2>
            <button onClick={() => setIsCategoryModalOpen(true)} className="bg-[#1C1C1C] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#F39223] transition-colors"><Plus size={18}/> Add Category</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-gray-900">{c.name}</h3>
                <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                </div>
                <p className="text-sm text-gray-500 mb-4 flex-1">{c.description || "No description."}</p>
                {c.quote && (
                    <div className="mt-auto bg-orange-50 p-3 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-800 font-bold uppercase tracking-wider mb-1">AI Tagline</p>
                    <p className="text-sm text-orange-900 italic">"{c.quote}"</p>
                    </div>
                )}
                </div>
            ))}
            </div>
            </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
            <div>
            <h2 className="text-3xl font-black text-gray-900 mb-8">Recent Orders</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
            <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
            <th className="p-4 font-bold border-b border-gray-100">Order ID</th>
            <th className="p-4 font-bold border-b border-gray-100">Customer</th>
            <th className="p-4 font-bold border-b border-gray-100">Total Amount</th>
            <th className="p-4 font-bold border-b border-gray-100">Status</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/50">
                <td className="p-4 font-bold text-gray-900">#{o.id}</td>
                <td className="p-4">
                <p className="font-bold text-gray-900">{o.customer_name}</p>
                <p className="text-sm text-gray-500">{o.customer_email}</p>
                </td>
                <td className="p-4 font-bold text-[#54A042]">₹{o.total_amount.toLocaleString('en-IN')}</td>
                <td className="p-4">
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{o.status}</span>
                </td>
                </tr>
            ))}
            </tbody>
            </table>
            {orders.length === 0 && <p className="p-8 text-center text-gray-400 font-medium">No orders yet.</p>}
            </div>
            </div>
        )}
        </main>

        {/* --- ADD / EDIT PRODUCT MODAL --- */}
        {isProductModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
            <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
            <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Product Name</label>
            <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category</label>
            <select required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none" value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})}>
            <option value="" disabled>Select a category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            </div>
            <div className="flex gap-4">
            <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price (₹)</label>
            <input required type="number" min="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
            </div>
            <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Stock</label>
            <input required type="number" min="0" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            </div>
            </div>
            <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
            <textarea rows="3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none resize-none" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-[#1C1C1C] text-white py-3 rounded-xl font-bold hover:bg-[#F39223] transition-colors mt-2">
            {editingProductId ? 'Update Product' : 'Save Product'}
            </button>
            </form>
            </div>
            </div>
        )}

        {/* --- ADD CATEGORY MODAL --- */}
        {isCategoryModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900">Add New Category</h3>
            <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-900 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
            <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category Name</label>
            <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} />
            </div>
            <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description (Optional)</label>
            <textarea rows="3" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F39223] outline-none resize-none" value={categoryForm.description} onChange={e => setCategoryForm({...categoryForm, description: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-[#1C1C1C] text-white py-3 rounded-xl font-bold hover:bg-[#F39223] transition-colors mt-2">
            Save Category (AI will generate quote)
            </button>
            </form>
            </div>
            </div>
        )}
        </div>
    )
}
