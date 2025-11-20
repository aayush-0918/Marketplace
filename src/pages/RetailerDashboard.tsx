import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';
import { Package, Plus, Edit, Trash2, ShoppingCart, Users, DollarSign } from 'lucide-react';

export default function RetailerDashboard() {
  const user = storage.getUser();
  const [products, setProducts] = useState(storage.getRetailerProducts(user?.id || ''));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '/placeholder.svg',
  });

  const customerPurchases = storage.getCustomerPurchases().filter(
    (p: any) => p.retailerId === user?.id
  );
  const wholesalerOrders = storage.getWholesalerOrders().filter(
    (o: any) => o.retailerId === user?.id
  );

  const totalRevenue = customerPurchases.reduce((sum: number, p: any) => sum + p.total, 0);
  const totalCustomers = new Set(customerPurchases.map((p: any) => p.customerId)).size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      storage.updateRetailerProduct(editingProduct.id, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      });
      toast.success('Product updated successfully!');
    } else {
      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        retailerId: user?.id,
        ratings: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      storage.addRetailerProduct(newProduct);
      toast.success('Product added successfully!');
    }

    setProducts(storage.getRetailerProducts(user?.id || ''));
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image: '/placeholder.svg',
    });
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      storage.deleteRetailerProduct(productId);
      setProducts(storage.getRetailerProducts(user?.id || ''));
      toast.success('Product deleted successfully!');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image: product.image,
    });
    setIsAddDialogOpen(true);
  };

  const handlePlaceWholesalerOrder = () => {
    const order = {
      id: Math.random().toString(36).substr(2, 9),
      retailerId: user?.id,
      items: [],
      total: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    storage.addWholesalerOrder(order);
    toast.success('Order placed with wholesaler!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Retailer Dashboard</h1>
          <p className="text-muted-foreground">Manage your inventory and track sales</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wholesaler Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wholesalerOrders.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <div className="flex gap-2">
            <Button onClick={handlePlaceWholesalerOrder}>
              Order from Wholesaler
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingProduct(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map((product: any) => (
            <Card key={product.id}>
              <CardHeader>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold">${product.price}</span>
                  <Badge variant={product.stock > 10 ? 'default' : 'destructive'}>
                    Stock: {product.stock}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {customerPurchases.length === 0 ? (
              <p className="text-muted-foreground">No purchases yet</p>
            ) : (
              <div className="space-y-4">
                {customerPurchases.slice(0, 5).map((purchase: any) => (
                  <div key={purchase.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{purchase.customerName}</p>
                      <p className="text-sm text-muted-foreground">{purchase.createdAt}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${purchase.total}</p>
                      <Badge>{purchase.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
