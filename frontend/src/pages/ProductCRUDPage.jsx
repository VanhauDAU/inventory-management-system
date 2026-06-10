import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from '../services/productService'
import '../styles/ProductCRUDPage.css'

const sortOptions = [
  { label: 'Moi nhat', value: '-created_at' },
  { label: 'Ten A-Z', value: 'name' },
  { label: 'Gia tang dan', value: 'price' },
  { label: 'Ton kho cao', value: '-quantity' },
]

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'USD',
})

function ProductCRUDPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [ordering, setOrdering] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')

  const showToast = (type, message) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadProducts = async () => {
    setListLoading(true)
    setListError('')

    try {
      const params = { page, ordering }

      if (search.trim()) params.search = search.trim()
      if (selectedCategory !== 'all') params.category = selectedCategory

      const [productsResponse, categoriesResponse] = await Promise.all([
        getProducts(params),
        getCategories(),
      ])

      const productData = productsResponse.data
      const categoryData = categoriesResponse.data
      const nextProducts = Array.isArray(productData.results) ? productData.results : productData

      setProducts(nextProducts)
      setTotalCount(productData.count || nextProducts.length)
      setCategories(Array.isArray(categoryData.results) ? categoryData.results : categoryData)
    } catch (err) {
      setListError('Khong tai duoc danh sach san pham. Vui long kiem tra backend hoac token dang nhap.')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [page, ordering, selectedCategory])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1)
      loadProducts()
    }, 350)

    return () => clearTimeout(timeoutId)
  }, [search])

  const visibleProducts = useMemo(() => {
    if (stockStatus === 'in-stock') {
      return products.filter((product) => Number(product.quantity) > 0)
    }

    if (stockStatus === 'out-of-stock') {
      return products.filter((product) => Number(product.quantity) === 0)
    }

    return products
  }, [products, stockStatus])

  const productStats = useMemo(() => {
    const totalValue = visibleProducts.reduce((sum, product) => {
      return sum + Number(product.price || 0) * Number(product.quantity || 0)
    }, 0)

    return {
      totalProducts: totalCount,
      lowStock: visibleProducts.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= 5).length,
      outOfStock: visibleProducts.filter((product) => Number(product.quantity) === 0).length,
      totalValue,
    }
  }, [totalCount, visibleProducts])

  const totalPages = Math.max(1, Math.ceil(totalCount / 10))

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('all')
    setStockStatus('all')
    setOrdering('-created_at')
    setPage(1)
  }

  const handleAdd = async (data) => {
    setSubmitLoading(true)
    try {
      await createProduct(data)
      setShowAddModal(false)
      await loadProducts()
      showToast('success', 'Them san pham thanh cong!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Them san pham that bai.'
      showToast('error', msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = async (data) => {
    setSubmitLoading(true)
    try {
      await updateProduct(editProduct.id, data)
      setEditProduct(null)
      await loadProducts()
      showToast('success', 'Cap nhat san pham thanh cong!')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cap nhat that bai.'
      showToast('error', msg)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
      await loadProducts()
      showToast('success', `Da xoa "${deleteTarget.name}" thanh cong!`)
    } catch (err) {
      showToast('error', 'Xoa san pham that bai.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="crud-page">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="crud-header">
        <div>
          <h1 className="crud-title">Quan ly san pham</h1>
          <p className="crud-subtitle">Layout, danh sach san pham, tim kiem va bo loc</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Them san pham
        </button>
      </div>

      <section className="stats-grid" aria-label="Thong ke san pham">
        <StatCard label="Tong san pham" value={productStats.totalProducts} />
        <StatCard label="Sap het hang" value={productStats.lowStock} tone="warning" />
        <StatCard label="Het hang" value={productStats.outOfStock} tone="danger" />
        <StatCard label="Gia tri ton kho" value={currencyFormatter.format(productStats.totalValue)} />
      </section>

      <section className="product-panel">
        <div className="panel-header">
          <div>
            <h2>Danh sach san pham</h2>
            <p>Tim kiem, loc va xem san pham tu Django REST API.</p>
          </div>
          <button className="btn btn-light" type="button" onClick={resetFilters}>
            Dat lai bo loc
          </button>
        </div>

        <div className="toolbar">
          <label className="field search-field">
            <span>Tim kiem</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nhap ten hoac mo ta san pham"
            />
          </label>

          <label className="field">
            <span>Danh muc</span>
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value)
                setPage(1)
              }}
            >
              <option value="all">Tat ca</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Ton kho</span>
            <select value={stockStatus} onChange={(event) => setStockStatus(event.target.value)}>
              <option value="all">Tat ca</option>
              <option value="in-stock">Con hang</option>
              <option value="out-of-stock">Het hang</option>
            </select>
          </label>

          <label className="field">
            <span>Sap xep</span>
            <select value={ordering} onChange={(event) => setOrdering(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {listError && <div className="list-error">{listError}</div>}

        <div className="table-wrap">
          <table className="product-table">
            <thead>
              <tr>
                <th>San pham</th>
                <th>Danh muc</th>
                <th>Gia</th>
                <th>Ton kho</th>
                <th>Trang thai</th>
                <th>Thao tac</th>
              </tr>
            </thead>
            <tbody>
              {listLoading && (
                <tr>
                  <td colSpan="6" className="state-cell">Dang tai danh sach san pham...</td>
                </tr>
              )}

              {!listLoading && visibleProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="state-cell">Khong co san pham phu hop.</td>
                </tr>
              )}

              {!listLoading && visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-name">{product.name}</div>
                    <div className="product-description">{product.description || 'Chua co mo ta'}</div>
                  </td>
                  <td>{product.category_detail?.name || `Category #${product.category}`}</td>
                  <td>{currencyFormatter.format(Number(product.price || 0))}</td>
                  <td>{product.quantity}</td>
                  <td><StockBadge quantity={product.quantity} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-light btn-small" type="button" onClick={() => setEditProduct(product)}>
                        Sua
                      </button>
                      <button className="btn btn-danger btn-small" type="button" onClick={() => setDeleteTarget(product)}>
                        Xoa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Trang {page} / {totalPages}</span>
          <div className="pagination-actions">
            <button className="btn btn-light" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Truoc
            </button>
            <button className="btn btn-light" type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Sau
            </button>
          </div>
        </div>
      </section>

      {showAddModal && (
        <Modal title="Them san pham moi" onClose={() => setShowAddModal(false)}>
          <ProductForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddModal(false)}
            loading={submitLoading}
          />
        </Modal>
      )}

      {editProduct && (
        <Modal title="Chinh sua san pham" onClose={() => setEditProduct(null)}>
          <ProductForm
            initialData={editProduct}
            onSubmit={handleEdit}
            onCancel={() => setEditProduct(null)}
            loading={submitLoading}
          />
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, tone = 'default' }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function StockBadge({ quantity }) {
  const stock = Number(quantity)

  if (stock === 0) {
    return <span className="badge danger">Het hang</span>
  }

  if (stock <= 5) {
    return <span className="badge warning">Sap het</span>
  }

  return <span className="badge success">Con hang</span>
}

export default ProductCRUDPage
