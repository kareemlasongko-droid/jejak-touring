export type TripStatus = "aktif" | "tiba" | "selesai";

export type Trip = {
  id: string;
  user_id: string;
  nickname: string;
  vehicle: "mobil" | "motor";
  vehicle_info: string | null;
  license_plate: string | null;
  driver_name: string | null;
  adult_count: number | null;
  child_count: number | null;
  emergency_contact: string | null;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  access_code: string;
  status: TripStatus;
  sos_at: string | null;
  created_at: string;
  updated_at: string;
  arrived_at: string | null;
  ended_at: string | null;
};

export type PantauData = {
  nickname: string;
  vehicle: "mobil" | "motor";
  vehicle_info: string | null;
  license_plate: string | null;
  driver_name: string | null;
  adult_count: number | null;
  child_count: number | null;
  emergency_contact: string | null;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  status: TripStatus;
  sos_at: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  accuracy: number | null;
  recorded_at: string | null;
  updated_at: string;
};

export type LocationPoint = {
  trip_id: string;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  recorded_at: string;
};
