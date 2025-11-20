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
import { Package, Plus, Edit, Trash2, Users, DollarSign, ShoppingCart, Wand2, Upload } from 'lucide-react';

export default function WholesalerDashboard() {
  const user = storage.getUser();
  const [products, setProducts] = useState(storage.getWholesalerProducts(user?.id || ''));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: '/placeholder.svg',
    minOrderQty: '10',
  });

  const retailerOrders = storage.getWholesalerOrders().filter(
    (o: any) => o.wholesalerId === user?.id || !o.wholesalerId
  );
  const totalRevenue = retailerOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
  const activeRetailers = new Set(retailerOrders.map((o: any) => o.retailerId)).size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      storage.updateWholesalerProduct(editingProduct.id, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minOrderQty: parseInt(formData.minOrderQty),
      });
      toast.success('Product updated successfully!');
    } else {
      const newProduct = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        minOrderQty: parseInt(formData.minOrderQty),
        wholesalerId: user?.id,
        ratings: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
      };
      storage.addWholesalerProduct(newProduct);
      toast.success('Product added successfully!');
    }

    setProducts(storage.getWholesalerProducts(user?.id || ''));
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image: '/placeholder.svg',
      minOrderQty: '10',
    });
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      storage.deleteWholesalerProduct(productId);
      setProducts(storage.getWholesalerProducts(user?.id || ''));
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
      minOrderQty: product.minOrderQty?.toString() || '10',
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateStock = (productId: string, change: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      const newStock = Math.max(0, product.stock + change);
      storage.updateWholesalerProduct(productId, { stock: newStock });
      setProducts(storage.getWholesalerProducts(user?.id || ''));
      toast.success(`Stock updated to ${newStock}`);
    }
  };

  const handleOrderStatusUpdate = (orderId: string, status: string) => {
    storage.updateWholesalerOrder(orderId, { status });
    toast.success(`Order ${status}!`);
  };

  const handleGenerateImage = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Please enter product name and description first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-product-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          productName: formData.name,
          description: formData.description,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setFormData({ ...formData, image: data.imageUrl });
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wholesaler Dashboard</h1>
          <p className="text-muted-foreground">Manage inventory for retailers</p>
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
              <CardTitle className="text-sm font-medium">Active Retailers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRetailers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {retailerOrders.filter((o: any) => o.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Inventory Management</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderQty">Min Order Qty</Label>
                    <Input
                      id="minOrderQty"
                      type="number"
                      value={formData.minOrderQty}
                      onChange={(e) => setFormData({ ...formData, minOrderQty: e.target.value })}
                      required
                    />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('image-upload')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !formData.name || !formData.description}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isGeneratingImage ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    {formData.image && formData.image !== '/placeholder.svg' && (
                      <img
                        src={formData.image}
                        alt="Product preview"
                        className="w-full h-48 object-cover rounded-md mt-2"
                      />
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">${product.price}</span>
                    <Badge variant={product.stock > 50 ? 'default' : 'destructive'}>
                      Stock: {product.stock}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStock(product.id, -10)}
                    >
                      -10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStock(product.id, 10)}
                    >
                      +10
                    </Button>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Retailer Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {retailerOrders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {retailerOrders.map((order: any) => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge>{order.status}</Badge>
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
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
