
import React from 'react';
import { 
  Utensils, 
  IceCream, 
  Coffee, 
  Flower2, 
  Shirt, 
  Dog
} from 'lucide-react';
import { Business, BusinessCategory, BusinessStatus } from './types';

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  [BusinessCategory.FOOD_TRUCK]: <Utensils size={18} />,
  [BusinessCategory.ICE_CREAM]: <IceCream size={18} />,
  [BusinessCategory.COFFEE]: <Coffee size={18} />,
  [BusinessCategory.FLOWER_TRUCK]: <Flower2 size={18} />,
  [BusinessCategory.FASHION_VAN]: <Shirt size={18} />,
  [BusinessCategory.PET_GROOMING]: <Dog size={18} />,
};

export const STATUS_COLORS: Record<BusinessStatus, string> = {
  [BusinessStatus.BUSY]: '#EF4444', // red-500
  [BusinessStatus.MODERATE]: '#3B82F6', // blue-500
  [BusinessStatus.EMPTY]: '#FFFFFF', // white
  [BusinessStatus.OFFLINE]: '#000000', // black
};

const DEFAULT_HOURS = {
  mon: '11:00 AM - 9:00 PM',
  tue: '11:00 AM - 9:00 PM',
  wed: '11:00 AM - 9:00 PM',
  thu: '11:00 AM - 10:00 PM',
  fri: '11:00 AM - 11:00 PM',
  sat: '10:00 AM - 11:00 PM',
  sun: '10:00 AM - 8:00 PM',
};

export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    ownerId: 'owner_123',
    name: 'Taco Galaxy',
    category: BusinessCategory.FOOD_TRUCK,
    status: BusinessStatus.BUSY,
    rating: 4.8,
    reviews: [
      { id: 'r1', userId: 'u1', userName: 'John D.', rating: 5, comment: 'Best street tacos in the city!', timestamp: Date.now() - 100000 }
    ],
    messages: [
      { id: 'm1', userId: 'u2', userName: 'Alice', text: 'How long is the line right now?', timestamp: Date.now() - 500000 },
      { id: 'm2', userId: 'u3', userName: 'Bob', text: 'Wait is about 10 mins, worth it!', timestamp: Date.now() - 400000 }
    ],
    posts: [
      { id: 'p_1', content: 'Huge special today: Buy 3 tacos get a free Horchata! 🌮🥤', timestamp: Date.now() - 3600000, isImportant: true },
      { id: 'p_2', content: 'We just arrived at Financial District. See you soon!', timestamp: Date.now() - 7200000 }
    ],
    location: [40.7128, -74.0060],
    description: 'Authentic Mexican street food moving across lower Manhattan.',
    imageUrl: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=400&q=80',
    openingHours: '11:00 AM - 10:00 PM',
    weeklyHours: DEFAULT_HOURS,
    isFavorite: false,
    favoriteCount: 245,
    currentVisitors: 12,
    tags: ['Halal', 'Spicy', 'Tacos'],
    route: [
      { id: 's1', locationName: 'Financial District', time: 'Until 9:00 PM', isCurrent: true, rsvps: 45 },
      { id: 's2', locationName: 'SoHo Broadway', time: 'Tomorrow 11:00 AM', isCurrent: false, rsvps: 12 }
    ],
    products: [
      { id: 'p1', name: 'Al Pastor Taco', price: 3.5, imageUrl: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=150&q=80' },
      { id: 'p2', name: 'Horchata', price: 2.0, imageUrl: 'https://images.unsplash.com/photo-1553181239-46219460021c?auto=format&fit=crop&w=150&q=80' }
    ]
  },
  {
    id: '2',
    ownerId: 'owner_456',
    name: 'Frosty Dreams',
    category: BusinessCategory.ICE_CREAM,
    status: BusinessStatus.MODERATE,
    rating: 4.5,
    reviews: [],
    messages: [],
    posts: [
      { id: 'p_3', content: 'New limited edition Lavender Honey popsicles just dropped! 🍦✨', timestamp: Date.now() - 10800000 }
    ],
    location: [40.7306, -73.9352],
    description: 'Premium soft serve and seasonal artisanal popsicles.',
    imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=400&q=80',
    openingHours: '12:00 PM - 9:00 PM',
    weeklyHours: { ...DEFAULT_HOURS, mon: 'Closed' },
    isFavorite: true,
    favoriteCount: 189,
    currentVisitors: 5,
    tags: ['Sweets', 'Gluten-Free', 'Dessert'],
    route: [
      { id: 's3', locationName: 'Williamsburg Park', time: 'Currently Here', isCurrent: true, rsvps: 28 },
      { id: 's4', locationName: 'Bushwick Inlet', time: 'Wed 1:00 PM', isCurrent: false, rsvps: 15 }
    ],
    products: [
      { id: 'p3', name: 'Vanilla Swirl', price: 4.5, imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=150&q=80' }
    ]
  },
  {
    id: '3',
    ownerId: 'owner_789',
    name: 'Steamy Brews',
    category: BusinessCategory.COFFEE,
    status: BusinessStatus.EMPTY,
    rating: 4.9,
    reviews: [],
    messages: [],
    posts: [
      { id: 'p_4', content: 'Early birds! We are open and the coffee is fresh. ☕️🌅', timestamp: Date.now() - 14400000 }
    ],
    location: [40.7200, -74.0100],
    description: 'Artisanal coffee and small-batch pastries.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80',
    openingHours: '7:00 AM - 4:00 PM',
    weeklyHours: { ...DEFAULT_HOURS, mon: '7:00 AM - 4:00 PM', sun: '8:00 AM - 2:00 PM' },
    isFavorite: false,
    favoriteCount: 120,
    currentVisitors: 2,
    tags: ['Coffee', 'Vegan', 'Organic'],
    route: [
      { id: 's5', locationName: 'Tribeca North', time: 'Active Now', isCurrent: true, rsvps: 5 }
    ],
    products: [
      { id: 'p4', name: 'Oat Milk Latte', price: 5.5, imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=150&q=80' }
    ]
  }
];
