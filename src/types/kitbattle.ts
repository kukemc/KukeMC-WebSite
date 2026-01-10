export interface KitBattlePeriods {
  uuid: string;
  last_weekly_id: string;
  weekly_kills_start: number;
  weekly_deaths_start: number;
  weekly_exp_start: number;
  weekly_coins_start: number;
  last_monthly_id: string;
  monthly_kills_start: number;
  monthly_deaths_start: number;
  monthly_exp_start: number;
  monthly_coins_start: number;
}

export interface KitBattleStats {
  uuid: string;
  name: string;
  kills: number;
  deaths: number;
  exp: number;
  coins: number;
  elo: number;
  rank: string;
  updated_at: number;
  favorite_kit: string | null;
  kits_stats: { kit_name: string; kills: number }[];
  periods?: KitBattlePeriods | null;
  current_week_id?: string;
  current_month_id?: string;
}
