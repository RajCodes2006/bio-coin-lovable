export interface WasteReport {
  id: string;
  date: string;
  type: "Plastic" | "Paper" | "Metal" | "Glass" | "Organic";
  weight: number;
  status: "Approved" | "Pending" | "Rejected";
  coins: number;
  image?: string;
}

export interface CityStats {
  city: string;
  rank: number;
  activeUsers: number;
  wasteCollected: number;
  rewardsRedeemed: number;
  wasteTypes: { type: string; percentage: number }[];
  monthlyTrend: { month: string; amount: number }[];
}

export interface RedeemItem {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: "Government" | "Private" | "NGO";
  icon: string;
}

export interface ClimateWorker {
  id: string;
  name: string;
  role: string;
  avatar: string;
  badge: "Gold" | "Silver" | "Bronze";
  bio: string;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export const wasteReports: WasteReport[] = [
  { id: "1", date: "Jun 15, 2023 10:45 AM", type: "Plastic", weight: 8.5, status: "Approved", coins: 85 },
  { id: "2", date: "Jun 12, 2023 03:22 PM", type: "Paper", weight: 5.2, status: "Approved", coins: 52 },
  { id: "3", date: "Jun 8, 2023 09:15 AM", type: "Metal", weight: 3.7, status: "Approved", coins: 37 },
  { id: "4", date: "Jun 5, 2023 11:30 AM", type: "Glass", weight: 2.1, status: "Pending", coins: 0 },
  { id: "5", date: "May 28, 2023 04:45 PM", type: "Organic", weight: 6.8, status: "Rejected", coins: 0 },
];

export const cityStats: CityStats = {
  city: "Mumbai",
  rank: 3,
  activeUsers: 12548,
  wasteCollected: 48.7,
  rewardsRedeemed: 3842,
  wasteTypes: [
    { type: "Plastic", percentage: 35 },
    { type: "Paper", percentage: 25 },
    { type: "Metal", percentage: 15 },
    { type: "Glass", percentage: 10 },
    { type: "Organic", percentage: 15 },
  ],
  monthlyTrend: [
    { month: "Jan", amount: 8.2 },
    { month: "Feb", amount: 9.1 },
    { month: "Mar", amount: 10.5 },
    { month: "Apr", amount: 11.2 },
    { month: "May", amount: 9.7 },
  ],
};

export const cityRankings = [
  { rank: 1, city: "Indore", score: 95, trend: "up" },
  { rank: 2, city: "Surat", score: 91, trend: "up" },
  { rank: 3, city: "Mumbai", score: 87, trend: "same" },
  { rank: 4, city: "Pune", score: 84, trend: "up" },
  { rank: 5, city: "Delhi", score: 79, trend: "down" },
  { rank: 6, city: "Bangalore", score: 76, trend: "up" },
  { rank: 7, city: "Chennai", score: 73, trend: "down" },
  { rank: 8, city: "Hyderabad", score: 70, trend: "same" },
  { rank: 9, city: "Kolkata", score: 67, trend: "up" },
  { rank: 10, city: "Jaipur", score: 64, trend: "down" },
];

export const redeemItems: RedeemItem[] = [
  { id: "1", title: "Electricity Bill Discount", description: "₹100 off on next electricity bill", cost: 500, category: "Government", icon: "⚡" },
  { id: "2", title: "Bus Pass (1 Week)", description: "Free city bus pass for one week", cost: 300, category: "Government", icon: "🚌" },
  { id: "3", title: "Water Bill Discount", description: "₹50 off on water bill", cost: 250, category: "Government", icon: "💧" },
  { id: "4", title: "Amazon Gift Card", description: "₹200 Amazon gift card", cost: 800, category: "Private", icon: "🛒" },
  { id: "5", title: "Flipkart Voucher", description: "₹150 Flipkart voucher", cost: 600, category: "Private", icon: "🎁" },
  { id: "6", title: "Plant a Tree Certificate", description: "Sponsor planting of a tree in your name", cost: 200, category: "NGO", icon: "🌳" },
];

export const climateWorkers: ClimateWorker[] = [
  { id: "w1", name: "Dr. Priya Mehta", role: "Environmental Scientist", avatar: "", badge: "Gold", bio: "Leading research on urban waste reduction in India", online: true },
  { id: "w2", name: "Arjun Kapoor", role: "Clean City Activist", avatar: "", badge: "Gold", bio: "Founded CleanIndia movement reaching 50+ cities", online: false },
  { id: "w3", name: "Sunita Desai", role: "Sustainability Consultant", avatar: "", badge: "Silver", bio: "Helping municipalities implement zero-waste strategies", online: true },
  { id: "w4", name: "Vikram Patel", role: "Recycling Innovator", avatar: "", badge: "Bronze", bio: "Developed affordable plastic recycling machines for rural areas", online: true },
  { id: "w5", name: "Anjali Rao", role: "Climate Educator", avatar: "", badge: "Silver", bio: "Teaching climate awareness in 200+ schools across India", online: false },
];

export const sampleChats: Record<string, ChatMessage[]> = {
  w1: [
    { id: "c1", senderId: "w1", text: "Welcome! Great to see you joining the movement for a cleaner India 🌱", timestamp: "10:30 AM" },
    { id: "c2", senderId: "user", text: "Thank you! I want to learn about waste segregation", timestamp: "10:31 AM" },
    { id: "c3", senderId: "w1", text: "That's wonderful! The key is to separate wet and dry waste at source. Would you like me to explain the categories?", timestamp: "10:32 AM" },
  ],
  w3: [
    { id: "c4", senderId: "w3", text: "Hi! How can I help you with sustainability today?", timestamp: "2:00 PM" },
  ],
};
