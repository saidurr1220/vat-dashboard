"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Plus, Users, Star, Loader2, AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  cost_ex_vat: string;
  sell_ex_vat: string;
}

interface ProductGroup {
  group_id: number;
  group_name: string;
  description: string;
  created_at: string;
  members: Array<{
    product_id: number;
    product_name: string;
    is_primary: boolean;
    category: string;
    cost_ex_vat: string;
    sell_ex_vat: string;
  }>;
}

export default function FootwearGroupsPage() {
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [primaryProduct, setPrimaryProduct] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch groups
      const groupsResponse = await fetch("/api/product-groups");
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData.groups || []);
      }

      // Fetch ungrouped footwear products
      const productsResponse = await fetch("/api/products");
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        const footwearProducts = productsData.filter(
          (p: Product) => p.category === "Footwear"
        );
        setProducts(footwearProducts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedProducts.length < 2 || !primaryProduct) {
      alert(
        "Please provide group name, select at least 2 products, and choose a primary product"
      );
      return;
    }

    setCreating(true);

    try {
      const response = await fetch("/api/product-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName: groupName.trim(),
          description: "",
          productIds: selectedProducts,
          primaryProductId: primaryProduct,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setGroupName("");
        setSelectedProducts([]);
        setPrimaryProduct(null);
        setShowCreateForm(false);

        // Refresh data
        await fetchData();
      } else {
        alert(result.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const toggleProductSelection = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
      if (primaryProduct === productId) {
        setPrimaryProduct(null);
      }
    } else {
      setSelectedProducts([...selectedProducts, productId]);
      if (!primaryProduct) {
        setPrimaryProduct(productId);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Product Groups</h1>
          <p className="text-muted-foreground">
            Merge similar footwear products for easier management
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? "Cancel" : "Create Group"}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Product Group</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Ladies Keds Collection"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Products to Group (minimum 2)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProducts.includes(product.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cost: ৳
                          {Number(product.cost_ex_vat || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {selectedProducts.includes(product.id) && (
                          <Badge variant="secondary" className="text-xs">
                            Selected
                          </Badge>
                        )}
                        {primaryProduct === product.id && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                        {selectedProducts.includes(product.id) &&
                          primaryProduct !== product.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryProduct(product.id);
                              }}
                            >
                              Set Primary
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Product Groups</h3>
            <p className="text-muted-foreground mb-4">
              Create groups to merge similar footwear products
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.map((group) => (
            <Card key={group.group_id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {group.group_name}
                </CardTitle>
                {group.description && (
                  <p className="text-sm text-muted-foreground">
                    {group.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div
                      key={member.product_id}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        {member.is_primary && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="text-sm font-medium">
                          {member.product_name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {member.is_primary && (
                          <Badge variant="default" className="text-xs">
                            Primary
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          ৳{Number(member.cost_ex_vat || 0).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{group.members.length} products</span>
                  <span>
                    Created {new Date(group.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
