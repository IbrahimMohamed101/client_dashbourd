export interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  packageName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes?: string;
  }[];
  status: 'pending' | 'preparing' | 'ready';
  deliveryDate: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface CourierTask {
  id: string;
  orderNumber: string;
  customerName: string;
  address: {
    street: string;
    city: string;
    zone: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  phone: string;
  status: 'pending' | 'out-for-delivery' | 'delivered' | 'failed';
  deliveryWindow: string;
  notes?: string;
}
