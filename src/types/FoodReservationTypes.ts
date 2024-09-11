export interface UserProfile {
  username: string;
  uid: string;
}

export interface CompetitionTeam {
  uid: string;
  name: string;
  tag: string;
  restaurant?: string;
  meals: any;
}

export interface TeamSpecificDateReservation {
  uid: string;
  numberOfMeals: number;
}
