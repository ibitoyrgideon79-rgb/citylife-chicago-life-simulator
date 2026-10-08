// Shared by client and server. Change here, both sides follow.

export const ROOM_NAME = "city";

export const TICK_MS = 50;           // server tick: 20 Hz
export const SPEED = 6;              // meters/sec walk speed, server-enforced
export const SPRINT_SPEED = 12;      // meters/sec sprint speed, server-enforced
export const CROUCH_SPEED = 3.2;     // meters/sec crouch walk speed, server-enforced
export const PRONE_SPEED = 1.6;      // meters/sec prone crawl speed, server-enforced
export const JUMP_VELOCITY = 7.2;    // initial jump impulse (m/s)
export const GRAVITY = 22;           // gravity (m/s^2)
export const WORLD_HALF = 110_000;   // regional bounds cover the Greater Chicago metro map
export const ZONE_DEFAULT = "loop";

// Vehicle Physics Constants
export const CAR_MAX_SPEED = 24;     // max driving speed (~55 mph)
export const CAR_REVERSE_SPEED = 9;  // reverse speed (~20 mph)
export const CAR_ACCEL = 26;         // acceleration rate (m/s^2)
export const CAR_TURN_RATE = 2.6;    // steering angular speed (rad/s)
export const CAR_HALF_W = 1.05;      // half width for collision (meters)
export const CAR_HALF_L = 2.4;       // half length for collision (meters)

export const MIN_INPUT_GAP_MS = 30;  // server rate limit per client
export const MAX_PLAYERS_PER_ROOM = 60;

export type Stance = "stand" | "crouch" | "prone";
export type Gender = "male" | "female";

// Client -> server messages (INTENTS only, never positions or balances)
export type InputMessage = {
  x: number;
  z: number;
  sprint?: boolean;
  jump?: boolean;
  stance?: Stance;
  brake?: boolean;
};

export type InteractMessage = {
  poiId: string;
};

export type VehicleMessage = {
  vehicleId: string;
};

export type WardrobeMessage = {
  jacketColor: string;
  pantsColor: string;
  sneakerColor: string;
  hairStyle: string;
};

export type LifeSelectMessage = {
  gender: Gender;
  professionId: string;
  companyId: string;
  characterName: string;
};

export type ToastMessage = {
  text: string;
  type: "success" | "info" | "warning";
  delta?: number;
};

export type HousingMessage = {
  propertyId: string;
  tenure: "rent" | "buy";
};

export type RideshareMessage = {
  x: number;
  z: number;
  name: string;
};

export type TransitMessage = {
  stationId: string;
};

export type SocialChatMessage = {
  text: string;
};

export type SocialChatEvent = {
  senderId: string;
  senderName: string;
  text: string;
};

export const MSG = {
  input: "input",
  interact: "interact",
  toast: "toast",
  vehicle_enter: "vehicle_enter",
  vehicle_exit: "vehicle_exit",
  enter_interior: "enter_interior",
  exit_interior: "exit_interior",
  door_toggle: "door_toggle",
  wardrobe_set: "wardrobe_set",
  sleep_bed: "sleep_bed",
  life_select: "life_select",
  eat_food: "eat_food",
  drink_beverage: "drink_beverage",
  office_work: "office_work",
  college_study: "college_study",
  player_attack: "player_attack",
  enter_mall: "enter_mall",
  exit_mall: "exit_mall",
  enter_culture: "enter_culture",
  exit_culture: "exit_culture",
  fast_travel: "fast_travel",
  housing_apply: "housing_apply",
  housing_vacate: "housing_vacate",
  home_go: "home_go",
  uber_request: "uber_request",
  uber_board: "uber_board",
  uber_cancel: "uber_cancel",
  hospital_discharge: "hospital_discharge",
  cta_trip: "cta_trip",
  social_chat: "social_chat",
  social_chat_event: "social_chat_event",
} as const;

export type POIDefinition = {
  id: string;
  name: string;
  actionText: string;
  x: number;
  z: number;
  icon: string;
  type:
    | "atm"
    | "coffee"
    | "job"
    | "subway"
    | "door"
    | "billboard"
    | "apartment"
    | "bed"
    | "wardrobe"
    | "fridge"
    | "mall"
    | "culture"
    | "office"
    | "hospital"
    | "food";
};

export type HousingProperty = {
  id: string;
  name: string;
  neighborhood: string;
  kind: "studio" | "flat" | "house" | "penthouse";
  weeklyRent: number;
  purchasePrice: number;
  x: number;
  z: number;
};

export const HOUSING_PROPERTIES: HousingProperty[] = [
  { id: "west-side-studio", name: "West Side Studio", neighborhood: "Garfield Park", kind: "studio", weeklyRent: 220, purchasePrice: 48000, x: -7200, z: -1900 },
  { id: "south-loop-flat", name: "South Loop Flat", neighborhood: "South Loop", kind: "flat", weeklyRent: 650, purchasePrice: 185000, x: 950, z: 1250 },
  { id: "logan-square-home", name: "Logan Square Two-Bed", neighborhood: "Logan Square", kind: "house", weeklyRent: 950, purchasePrice: 295000, x: -6800, z: -5200 },
  { id: "gold-coast-penthouse", name: "Gold Coast Penthouse", neighborhood: "Gold Coast", kind: "penthouse", weeklyRent: 3600, purchasePrice: 1_000_000, x: 1450, z: -2400 },
];

export type TransitStation = {
  id: string;
  name: string;
  line: string;
  x: number;
  z: number;
};

export const CTA_STATIONS: TransitStation[] = [
  { id: "cta-howard", name: "Howard", line: "Red / Purple / Yellow", x: 1300, z: -22500 },
  { id: "cta-belmont", name: "Belmont", line: "Red / Brown / Purple", x: 850, z: -8200 },
  { id: "cta-clark-lake", name: "Clark/Lake", line: "Blue / Red / Brown / Green / Orange / Purple / Pink", x: -250, z: -150 },
  { id: "cta-roosevelt", name: "Roosevelt", line: "Red / Orange / Green", x: 250, z: 2200 },
  { id: "cta-95th", name: "95th/Dan Ryan", line: "Red", x: -600, z: 15100 },
  { id: "cta-uic", name: "UIC-Halsted", line: "Blue", x: -2100, z: 1900 },
  { id: "cta-ohare", name: "O'Hare", line: "Blue", x: -20800, z: -18500 },
  { id: "cta-midway", name: "Midway", line: "Orange", x: -9300, z: 13200 },
];

// ─────────────────────────────────────────────────────────────────────────────
// 16+ REALISTIC PROFESSIONS WITH 3 REAL COMPANIES EACH (Step 3)
// ─────────────────────────────────────────────────────────────────────────────
export type CompanyInfo = {
  id: string;
  name: string;
  address: string;
  x: number;
  z: number;
  salaryPerShift: number;
  description: string;
};

export type ProfessionConfig = {
  id: string;
  title: string;
  icon: string;
  category: "Medical" | "Tech" | "Legal" | "Underground" | "Public Service" | "Finance" | "Creative" | "Hospitality" | "Academia";
  startingSalary: number;
  description: string;
  uniform: {
    jacketColor: string;
    pantsColor: string;
    sneakerColor: string;
  };
  companies: [CompanyInfo, CompanyInfo, CompanyInfo];
};

export const PROFESSIONS: ProfessionConfig[] = [
  {
    id: "doctor",
    title: "Trauma Surgeon / Doctor",
    icon: "🩺",
    category: "Medical",
    startingSalary: 420,
    description: "Save lives at prestigious Chicago medical complexes. High prestige and salary.",
    uniform: { jacketColor: "#0284c7", pantsColor: "#0369a1", sneakerColor: "#ffffff" },
    companies: [
      { id: "hosp_northwestern", name: "Northwestern Memorial Hospital", address: "251 E Huron St", x: 45, z: -40, salaryPerShift: 420, description: "Premier downtown Chicago academic medical center." },
      { id: "hosp_rush", name: "Rush University Medical Center", address: "1653 W Congress Pkwy", x: -55, z: 45, salaryPerShift: 390, description: "Top-tier Level 1 trauma center and research institute." },
      { id: "hosp_lurie", name: "Ann & Robert H. Lurie Children's", address: "225 E Chicago Ave", x: 60, z: -25, salaryPerShift: 405, description: "World-class specialty pediatric care facility." },
    ],
  },
  {
    id: "software_engineer",
    title: "Cloud Software Engineer / IT",
    icon: "💻",
    category: "Tech",
    startingSalary: 380,
    description: "Write ultra-low-latency backend distributed systems and manage cloud clusters in the Loop.",
    uniform: { jacketColor: "#1e293b", pantsColor: "#334155", sneakerColor: "#f1f5f9" },
    companies: [
      { id: "tech_google", name: "Google Chicago Loop Campus", address: "Clark & Randolph St", x: -10, z: -60, salaryPerShift: 450, description: "Global hyperscale engineering headquarters in Chicago Loop." },
      { id: "tech_citadel", name: "Citadel Securities Tech Labs", address: "131 S Dearborn St", x: 25, z: 15, salaryPerShift: 520, description: "Cutting-edge algorithmic financial trading architecture." },
      { id: "tech_motorola", name: "Motorola Solutions Mart Tower", address: "222 Merchandise Mart Plaza", x: -45, z: -80, salaryPerShift: 360, description: "Public safety communications and cloud systems." },
    ],
  },
  {
    id: "lawyer",
    title: "Corporate Defense Attorney",
    icon: "⚖️",
    category: "Legal",
    startingSalary: 450,
    description: "Argue multi-million-dollar civil cases and defend corporations across LaSalle Street.",
    uniform: { jacketColor: "#09090b", pantsColor: "#09090b", sneakerColor: "#18181b" },
    companies: [
      { id: "law_kirkland", name: "Kirkland & Ellis LLP", address: "300 N LaSalle Dr", x: 15, z: -70, salaryPerShift: 480, description: "World's highest-grossing law firm headquartered in Chicago." },
      { id: "law_sidley", name: "Sidley Austin Global Counsel", address: "One S Dearborn", x: 28, z: 2, salaryPerShift: 460, description: "Century-old international corporate litigation firm." },
      { id: "law_jenner", name: "Jenner & Block Appellate Law", address: "353 N Clark St", x: -5, z: -65, salaryPerShift: 430, description: "Renowned constitutional and corporate defense firm." },
    ],
  },
  {
    id: "thug",
    title: "Street Boss / Hustler",
    icon: "🔫",
    category: "Underground",
    startingSalary: 350,
    description: "Run street operations, street protection rackets, and black-market trade across back alleys.",
    uniform: { jacketColor: "#dc2626", pantsColor: "#09090b", sneakerColor: "#dc2626" },
    companies: [
      { id: "crew_southloop", name: "South Loop Syndicate HQ", address: "State & Roosevelt Alley", x: 50, z: 85, salaryPerShift: 420, description: "Underground network running Loop distribution routes." },
      { id: "crew_westside", name: "West Side Auto Imports", address: "Ogden & Adams Yards", x: -80, z: 20, salaryPerShift: 380, description: "Chop-shop front moving modified vehicles." },
      { id: "crew_cermak", name: "Cermak Road Smugglers", address: "Cermak & Canal Pier", x: -35, z: 95, salaryPerShift: 340, description: "Night-shift port cargo redistribution racket." },
    ],
  },
  {
    id: "police",
    title: "CPD Detective / Police Officer",
    icon: "🚓",
    category: "Public Service",
    startingSalary: 310,
    description: "Patrol the Loop, intercept street cultists, investigate robberies, and protect civilians.",
    uniform: { jacketColor: "#1e3a8a", pantsColor: "#172554", sneakerColor: "#09090b" },
    companies: [
      { id: "cpd_dist1", name: "Chicago Police 1st District Central", address: "1718 S State St", x: 40, z: 70, salaryPerShift: 320, description: "Command precinct safeguarding downtown Chicago Loop." },
      { id: "cpd_detective", name: "CPD Area 3 Detective Division", address: "2452 W Belmont Ave", x: -60, z: -30, salaryPerShift: 350, description: "Special investigations and high-profile felony division." },
      { id: "cpd_transit", name: "CPD Public Transit Safety Unit", address: "State & Lake CTA Substation", x: 10, z: -40, salaryPerShift: 300, description: "Subway platform and street bus rapid patrol." },
    ],
  },
  {
    id: "trader",
    title: "CME Futures & Options Trader",
    icon: "📈",
    category: "Finance",
    startingSalary: 490,
    description: "Trade S&P 500, crude oil, and interest rate derivatives in the financial heart of America.",
    uniform: { jacketColor: "#15803d", pantsColor: "#1e293b", sneakerColor: "#ffffff" },
    companies: [
      { id: "cme_cbot", name: "Chicago Board of Trade (CBOT)", address: "141 W Jackson Blvd", x: -28, z: 18, salaryPerShift: 550, description: "Historic trading pits with monumental Ceres statue." },
      { id: "cme_group", name: "CME Group Global Exchange", address: "20 S Wacker Dr", x: -50, z: -10, salaryPerShift: 520, description: "World's premier derivatives marketplace." },
      { id: "cme_drw", name: "DRW Proprietary Trading Floor", address: "540 W Madison St", x: -65, z: -25, salaryPerShift: 480, description: "High-frequency algorithmic market-making giant." },
    ],
  },
  {
    id: "firefighter",
    title: "Chicago Firefighter / Paramedic",
    icon: "🚒",
    category: "Public Service",
    startingSalary: 300,
    description: "Respond to structure alarms, save trapped civilians from high-rises, and drive Fire Engines.",
    uniform: { jacketColor: "#ea580c", pantsColor: "#7c2d12", sneakerColor: "#09090b" },
    companies: [
      { id: "cfd_eng18", name: "Chicago Fire Engine Co. 18", address: "1360 S Blue Island Ave", x: -70, z: 60, salaryPerShift: 310, description: "Legendary historic Chicago firehouse." },
      { id: "cfd_loop13", name: "CFD Loop Station #13", address: "259 N Columbus Dr", x: 55, z: -50, salaryPerShift: 320, description: "High-rise fire suppression and rapid river rescue." },
      { id: "cfd_truck2", name: "CFD Hook & Ladder Truck #2", address: "212 W Cermak Rd", x: -20, z: 85, salaryPerShift: 290, description: "Heavy vehicle extrication and paramedic squad." },
    ],
  },
  {
    id: "barista",
    title: "Artisan Coffee Roaster & Barista",
    icon: "☕",
    category: "Hospitality",
    startingSalary: 180,
    description: "Pull artisanal espresso shots, roast micro-lot beans, and power Chicago's working class.",
    uniform: { jacketColor: "#78350f", pantsColor: "#451a03", sneakerColor: "#ffffff" },
    companies: [
      { id: "coffee_intelli", name: "Intelligentsia Millennium Coffee", address: "53 E Randolph St", x: 22, z: -35, salaryPerShift: 190, description: "Pioneering Chicago direct-trade third-wave roastery." },
      { id: "coffee_heritage", name: "Heritage Bikes & Coffee Roasters", address: "2959 N Lincoln Ave", x: -35, z: -45, salaryPerShift: 180, description: "Handmade bicycles and locally roasted single-origins." },
      { id: "coffee_darkmatter", name: "Dark Matter Coffee Mothership", address: "738 N Western Ave", x: -80, z: -15, salaryPerShift: 185, description: "Experimental barrel-aged craft coffee lab." },
    ],
  },
  {
    id: "taxi_driver",
    title: "Yellow Cab & Rideshare Driver",
    icon: "🚕",
    category: "Hospitality",
    startingSalary: 240,
    description: "Master every Loop alley and Michigan Avenue intersection. Pick up fares across Chicago.",
    uniform: { jacketColor: "#eab308", pantsColor: "#1e293b", sneakerColor: "#ffffff" },
    companies: [
      { id: "taxi_fleet_chi", name: "Chicago Yellow Cab Co. Fleet Depot", address: "3351 W Addison St", x: 30, z: 5, salaryPerShift: 260, description: "Iconic yellow cab fleet operating 24/7 downtown." },
      { id: "taxi_flash", name: "Flash Cab Loop Dispatch", address: "5348 N Clark St", x: -15, z: 35, salaryPerShift: 240, description: "Chicago's largest continuous taxi association." },
      { id: "taxi_uber_hub", name: "Uber Greenlight Chicago Hub", address: "1401 W North Ave", x: -60, z: -55, salaryPerShift: 250, description: "High-volume private luxury rideshare dispatch." },
    ],
  },
  {
    id: "architect",
    title: "Skyscraper Architect & Engineer",
    icon: "🏗️",
    category: "Creative",
    startingSalary: 370,
    description: "Design soaring mega-tall towers and historic terracotta renovations shaping the Chicago skyline.",
    uniform: { jacketColor: "#0f172a", pantsColor: "#475569", sneakerColor: "#cbd5e1" },
    companies: [
      { id: "arch_som", name: "Skidmore, Owings & Merrill (SOM)", address: "224 S Michigan Ave", x: 32, z: -15, salaryPerShift: 400, description: "Architects of the Willis Tower & John Hancock Center." },
      { id: "arch_gang", name: "Studio Gang Architects (Aqua Tower)", address: "1520 W Division St", x: 65, z: -35, salaryPerShift: 380, description: "Visionary sustainable skyscraper designers." },
      { id: "arch_perkins", name: "Perkins&Will Global Studio", address: "410 N Michigan Ave", x: 42, z: -65, salaryPerShift: 360, description: "Masterminds behind civic, educational, and healthcare towers." },
    ],
  },
  {
    id: "journalist",
    title: "Investigative News Reporter",
    icon: "📰",
    category: "Creative",
    startingSalary: 260,
    description: "Break front-page exposés on City Hall corruption, street crime, and Loop commerce.",
    uniform: { jacketColor: "#334155", pantsColor: "#1e293b", sneakerColor: "#94a3b8" },
    companies: [
      { id: "news_tribune", name: "Chicago Tribune Tower Bureau", address: "435 N Michigan Ave", x: 38, z: -75, salaryPerShift: 280, description: "Pulitzer-prize winning voice of the Midwest since 1847." },
      { id: "news_suntimes", name: "Chicago Sun-Times City Hall Desk", address: "30 N Racine Ave", x: -30, z: -20, salaryPerShift: 260, description: "Hard-hitting investigative journalism watchdog." },
      { id: "news_wgn", name: "WGN News Channel 9 Loop Studios", address: "2501 W Bradley Pl", x: -70, z: -70, salaryPerShift: 270, description: "Chicago's Very Own live broadcast network." },
    ],
  },
  {
    id: "music_producer",
    title: "Drill & Hip-Hop Music Producer",
    icon: "🎵",
    category: "Creative",
    startingSalary: 310,
    description: "Engineer heavy 808 beats, record drill anthems, and drop hit records for Chicago artists.",
    uniform: { jacketColor: "#8b5cf6", pantsColor: "#09090b", sneakerColor: "#f43f5e" },
    companies: [
      { id: "studio_312", name: "312 Soundworks Master Studio", address: "Wicker Park Audio Lab", x: -75, z: 5, salaryPerShift: 330, description: "Multi-platinum vocal tracking & mastering facility." },
      { id: "studio_windy", name: "Windy City Beats Recording", address: "South Loop Arts Corridor", x: 55, z: 50, salaryPerShift: 310, description: "Underground boom-bap and modern drill label." },
      { id: "studio_defjam", name: "Chicago Street Records", address: "Michigan Ave Penthouse", x: 25, z: -55, salaryPerShift: 340, description: "Commercial chart-topping artist incubator." },
    ],
  },
  {
    id: "chef",
    title: "Michelin-Star Executive Chef",
    icon: "🧑‍🍳",
    category: "Hospitality",
    startingSalary: 340,
    description: "Lead premier fine dining kitchens, craft signature dishes, and command the culinary scene.",
    uniform: { jacketColor: "#ffffff", pantsColor: "#09090b", sneakerColor: "#09090b" },
    companies: [
      { id: "rest_alinea", name: "Alinea Molecular Gastronomy", address: "1723 N Halsted St", x: -45, z: -65, salaryPerShift: 390, description: "3-Star Michelin world-renowned culinary institution." },
      { id: "rest_girlandgoat", name: "Girl & The Goat West Loop", address: "809 W Randolph St", x: -60, z: -10, salaryPerShift: 330, description: "Famous bustling Fulton Market open kitchen." },
      { id: "rest_gibson", name: "Gibson's Bar & Steakhouse", address: "1028 N Rush St", x: 48, z: -85, salaryPerShift: 350, description: "Quintessential legendary Chicago prime steakhouse." },
    ],
  },
  {
    id: "banker",
    title: "Senior Investment Banker",
    icon: "🏦",
    category: "Finance",
    startingSalary: 470,
    description: "Underwrite mergers, structure capital deals, and manage multi-billion wealth portfolios.",
    uniform: { jacketColor: "#0f172a", pantsColor: "#1e293b", sneakerColor: "#09090b" },
    companies: [
      { id: "bank_chase", name: "Chase Tower Commercial Capital", address: "10 S Dearborn St", x: 12, z: 8, salaryPerShift: 500, description: "Iconic curving 60-story banking headquarters." },
      { id: "bank_bmo", name: "BMO Harris Bank Tower", address: "320 S Canal St", x: -40, z: 30, salaryPerShift: 460, description: "Major multinational North American banking institution." },
      { id: "bank_northerntrust", name: "Northern Trust Wealth Management", address: "50 S LaSalle St", x: -18, z: 12, salaryPerShift: 480, description: "Historic LaSalle Street asset management tower." },
    ],
  },
  {
    id: "courier",
    title: "Federal Plaza Bicycle & Van Courier",
    icon: "📦",
    category: "Hospitality",
    startingSalary: 210,
    description: "Sprint through Chicago Loop gridlock delivering legal filings, blueprints, and cargo packages.",
    uniform: { jacketColor: "#2563eb", pantsColor: "#1e293b", sneakerColor: "#facc15" },
    companies: [
      { id: "pkg_fedex", name: "Federal Plaza Courier Dispatch", address: "219 S Dearborn St", x: -24, z: 22, salaryPerShift: 220, description: "Rapid downtown document and parcel logistics hub." },
      { id: "pkg_ups", name: "UPS Loop Air Express Station", address: "Jefferson & Monroe St", x: -55, z: 5, salaryPerShift: 210, description: "High-velocity freight sorting facility." },
      { id: "pkg_dhl", name: "DHL Express Chicago Gateway", address: "O'Hare & Loop Logistics Line", x: 15, z: 45, salaryPerShift: 230, description: "International diplomatic and priority shipping depot." },
    ],
  },
  {
    id: "professor",
    title: "University Tenured Professor",
    icon: "🎓",
    category: "Academia",
    startingSalary: 330,
    description: "Lecture auditoriums of students, publish research papers, and mentor future leaders.",
    uniform: { jacketColor: "#854d0e", pantsColor: "#334155", sneakerColor: "#475569" },
    companies: [
      { id: "edu_uchicago", name: "University of Chicago Booth Center", address: "450 N Cityfront Plaza", x: 50, z: -60, salaryPerShift: 360, description: "Nobel-prize-winning economics and research university." },
      { id: "edu_northwestern", name: "Northwestern Pritzker School of Law", address: "375 E Chicago Ave", x: 58, z: -40, salaryPerShift: 340, description: "Elite lakefront legal academic institution." },
      { id: "edu_depaul", name: "DePaul University Loop Campus", address: "1 E Jackson Blvd", x: 8, z: 18, salaryPerShift: 310, description: "Nation's largest Catholic university campus." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STREET LEVEL & LANDMARK POIS
// ─────────────────────────────────────────────────────────────────────────────
export const INTERACTIVE_POIS: POIDefinition[] = [
  // 1. Photo 1: Chicago Cultural Center (Preston Bradley Hall)
  {
    id: "chicago_cultural_center",
    name: "Chicago Cultural Center (Preston Bradley Hall)",
    actionText: "Enter Grand Beaux-Arts Hall & Tiffany Dome [E]",
    x: 32.0,
    z: -38.0,
    icon: "🏛️",
    type: "culture",
  },

  // 2. Photo 2: Willis Tower (Sears Tower 442m Skydeck)
  {
    id: "willis_tower_lobby",
    name: "Willis Tower (Sears Tower) · Skydeck 103",
    actionText: "Enter Willis Tower 9-Tube Atrium [E]",
    x: -42.0,
    z: 16.0,
    icon: "🏢",
    type: "office",
  },

  // 3. Apartment Safehouse Penthouse
  {
    id: "apt_entrance",
    name: "Adams Street Lofts · Penthouse 402",
    actionText: "Enter Safehouse Apartment [E]",
    x: 14.0,
    z: -3.8,
    icon: "🏠",
    type: "apartment",
  },

  // 4. Chicago Loop Shopping Mall (Block 37 / Water Tower Place)
  {
    id: "chicago_mall_entrance",
    name: "Chicago Loop Mega Mall · Block 37",
    actionText: "Enter 4-Story Shopping Mall & Food Court [E]",
    x: -8.0,
    z: -26.0,
    icon: "🛍️",
    type: "mall",
  },

  // 5. Chase Tower ATM
  {
    id: "atm_chase",
    name: "Chase Bank & 24/7 ATM",
    actionText: "Withdraw Daily Allowance (+$150)",
    x: 8.0,
    z: -3.8,
    icon: "🏧",
    type: "atm",
  },

  // 6. Loop Coffee Roastery
  {
    id: "loop_coffee",
    name: "Loop Artisan Coffee Co.",
    actionText: "Buy Fresh Chicago Roast Espresso (-$6, +Stamina)",
    x: 18.0,
    z: 18.5,
    icon: "☕",
    type: "coffee",
  },

  // 7. CTA Subway Station
  {
    id: "cta_subway",
    name: "CTA Blue Line Subway Station",
    actionText: "Enter Subway Pedway (-$3)",
    x: -5.0,
    z: 2.2,
    icon: "🚇",
    type: "subway",
  },

  // 8. Chicago Deep Dish Pizza Stand
  {
    id: "chicago_pizza_stand",
    name: "Lou's Legendary Deep Dish Pizza Stand",
    actionText: "Order Buttercrust Deep-Dish Slice (-$12, +Hunger & Health)",
    x: 24.0,
    z: 16.0,
    icon: "🍕",
    type: "food",
  },

  // 9. Chicago Hot Dog Cart
  {
    id: "chicago_hotdog_cart",
    name: "Vienna Beef Authentic Chicago Hot Dog Cart",
    actionText: "Buy All-Beef Dog Dragged Through Garden (-$8, +Hunger)",
    x: -30.0,
    z: 17.0,
    icon: "🌭",
    type: "food",
  },

  // 10. Digital Billboard
  {
    id: "billboard_kiosk",
    name: "State & Adams Billboard Kiosk",
    actionText: "Rent Digital Billboard (-$250)",
    x: 43.5,
    z: 36.5,
    icon: "📺",
    type: "billboard",
  },
  {
    id: "county_hospital",
    name: "Cook County Hospital Emergency Department",
    actionText: "Check in for treatment ($150, restore health)",
    x: -92,
    z: 86,
    icon: "🏥",
    type: "hospital",
  },
  {
    id: "central_police",
    name: "Chicago Police Central District",
    actionText: "Report an incident / clear a wanted alert",
    x: 115,
    z: -145,
    icon: "🚓",
    type: "office",
  },
];

// Apartment Safehouse Interior POIs
export const APARTMENT_POIS: POIDefinition[] = [
  {
    id: "apt_bed",
    name: "King Silk Bed",
    actionText: "Rest & Sleep in Bed (+100% Energy & Safehouse Save) [E]",
    x: 5.2,
    z: -3.2,
    icon: "🛏️",
    type: "bed",
  },
  {
    id: "apt_wardrobe",
    name: "Walk-In Clothing Wardrobe",
    actionText: "Open Wardrobe / Change Outfits [E]",
    x: -5.2,
    z: -3.2,
    icon: "👔",
    type: "wardrobe",
  },
  {
    id: "apt_fridge",
    name: "Stainless Steel Refrigerator",
    actionText: "Eat Snack & Drink Energy Soda (+Hunger & Thirst) [E]",
    x: -5.2,
    z: 2.8,
    icon: "🥤",
    type: "fridge",
  },
  {
    id: "apt_door",
    name: "Penthouse Entrance Door",
    actionText: "Toggle Door Open / Shut [E]",
    x: 0,
    z: 4.9,
    icon: "🚪",
    type: "door",
  },
  {
    id: "apt_exit",
    name: "Exit to Chicago Streets",
    actionText: "Step Outside onto Street [F]",
    x: 0,
    z: 4.2,
    icon: "🏙️",
    type: "door",
  },
];

// Chicago Loop Mall Interior POIs (Block 37)
export const MALL_POIS: POIDefinition[] = [
  {
    id: "mall_foodcourt_pizza",
    name: "Giordano's Deep Dish Counter",
    actionText: "Order Chicago Stuffed Deep Dish (-$18, +50 Hunger) [E]",
    x: -4.5,
    z: -4.0,
    icon: "🍕",
    type: "food",
  },
  {
    id: "mall_sneaker_shop",
    name: "Flight Club Chicago Sneaker Boutique",
    actionText: "Browse Rare Kicks & Jordans [E]",
    x: 4.5,
    z: -4.0,
    icon: "👟",
    type: "wardrobe",
  },
  {
    id: "mall_apple_store",
    name: "Tech Flagship Electronics Store",
    actionText: "Upgrade Gadgets & Smartphones [E]",
    x: -4.5,
    z: 3.5,
    icon: "📱",
    type: "office",
  },
  {
    id: "mall_exit",
    name: "Mall Street Exit",
    actionText: "Step Outside to State Street [F]",
    x: 0,
    z: 5.2,
    icon: "🏙️",
    type: "door",
  },
];

// Chicago Cultural Center Interior POIs (Photo 1)
export const CULTURAL_CENTER_POIS: POIDefinition[] = [
  {
    id: "culture_dome",
    name: "Tiffany Glass Dome · Preston Bradley Hall",
    actionText: "Admire World's Largest Tiffany Stained-Glass Dome [E]",
    x: 0,
    z: -2.0,
    icon: "✨",
    type: "culture",
  },
  {
    id: "culture_exhibit",
    name: "Chicago Architecture & History Gallery",
    actionText: "Read 1897 Chicago Public Library Chronicles [E]",
    x: 4.2,
    z: 1.0,
    icon: "📖",
    type: "culture",
  },
  {
    id: "culture_exit",
    name: "Michigan Avenue Bronze Grand Portal",
    actionText: "Exit to Michigan Avenue Sidewalk [F]",
    x: 0,
    z: 5.2,
    icon: "🏛️",
    type: "door",
  },
];

export type VehicleConfig = {
  id: string;
  x: number;
  z: number;
  rot: number;
  color: string;
  model: "taxi" | "sedan" | "suv" | "sports" | "police" | "ambulance";
  name: string;
  speed?: number;
  traffic?: {
    axis: "x" | "z";
    min: number;
    max: number;
    lane: number;
    direction: -1 | 1;
    speed: number;
  };
};

export const INITIAL_VEHICLES: VehicleConfig[] = [
  {
    id: "taxi_104",
    x: 24,
    z: 2.5,
    rot: Math.PI / 2,
    color: "#facc15",
    model: "taxi",
    name: "Chicago Yellow Cab #104",
    traffic: { axis: "x", min: -115, max: 115, lane: 2.5, direction: -1, speed: 7 },
  },
  {
    id: "sedan_blue",
    x: 44,
    z: 2.5,
    rot: Math.PI / 2,
    color: "#2563eb",
    model: "sedan",
    name: "Blue Street Sedan",
    traffic: { axis: "x", min: -115, max: 115, lane: 2.5, direction: -1, speed: 7 },
  },
  {
    id: "sports_red",
    x: 62,
    z: 2.5,
    rot: Math.PI / 2,
    color: "#dc2626",
    model: "sports",
    name: "Red Sports Coupe",
    traffic: { axis: "x", min: -115, max: 115, lane: 2.5, direction: -1, speed: 7 },
  },
  {
    id: "taxi_219",
    x: 18,
    z: 9.5,
    rot: -Math.PI / 2,
    color: "#facc15",
    model: "taxi",
    name: "Chicago Yellow Cab #219",
    traffic: { axis: "x", min: -115, max: 115, lane: 9.5, direction: 1, speed: 7 },
  },
  {
    id: "suv_white",
    x: 34,
    z: 9.5,
    rot: -Math.PI / 2,
    color: "#f8fafc",
    model: "suv",
    name: "Executive White SUV",
    traffic: { axis: "x", min: -115, max: 115, lane: 9.5, direction: 1, speed: 7 },
  },
  {
    id: "exec_black",
    x: -9,
    z: 42,
    rot: 0,
    color: "#09090b",
    model: "sedan",
    name: "Black VIP Sedan",
    traffic: { axis: "z", min: -68, max: 60, lane: -9, direction: -1, speed: 6 },
  },
  {
    id: "taxi_305",
    x: -3,
    z: -20,
    rot: Math.PI,
    color: "#facc15",
    model: "taxi",
    name: "Chicago Yellow Cab #305",
    traffic: { axis: "z", min: -68, max: 60, lane: -3, direction: 1, speed: 6 },
  },
  {
    id: "taxi_410",
    x: -64,
    z: 2.5,
    rot: Math.PI / 2,
    color: "#facc15",
    model: "taxi",
    name: "Chicago Yellow Cab #410",
    traffic: { axis: "x", min: -115, max: 115, lane: 2.5, direction: -1, speed: 7 },
  },
  {
    id: "suv_black",
    x: -62,
    z: 9.5,
    rot: -Math.PI / 2,
    color: "#202426",
    model: "suv",
    name: "Black Chicago SUV",
    traffic: { axis: "x", min: -115, max: 115, lane: 9.5, direction: 1, speed: 6.5 },
  },
  {
    id: "sports_silver",
    x: 76,
    z: 9.5,
    rot: -Math.PI / 2,
    color: "#8b9295",
    model: "sports",
    name: "Silver Sports Coupe",
    traffic: { axis: "x", min: -115, max: 115, lane: 9.5, direction: 1, speed: 8 },
  },
  {
    id: "cpd_patrol_01",
    x: -80,
    z: 2.5,
    rot: Math.PI / 2,
    color: "#172554",
    model: "police",
    name: "Chicago Police Patrol",
    traffic: { axis: "x", min: -115, max: 115, lane: 2.5, direction: -1, speed: 9 },
  },
  {
    id: "cfd_ambulance_01",
    x: 83,
    z: 9.5,
    rot: -Math.PI / 2,
    color: "#f8fafc",
    model: "ambulance",
    name: "Chicago Fire Department Ambulance",
    traffic: { axis: "x", min: -115, max: 115, lane: 9.5, direction: 1, speed: 8 },
  },
];

export type StreetWaypoint = {
  x: number;
  z: number;
  activity: string;
  pauseSeconds: number;
};

export type StreetPedestrianConfig = {
  id: string;
  name: string;
  gender: Gender;
  topColor: string;
  bottomColor: string;
  x: number;
  z: number;
  itinerary: StreetWaypoint[];
};

export const STREET_PEDESTRIANS: StreetPedestrianConfig[] = [
  {
    id: "loop_commuter_1",
    name: "Financial District Commuter",
    gender: "male",
    topColor: "#2563eb",
    bottomColor: "#334155",
    x: 16,
    z: 22,
    itinerary: [
      { x: 21, z: 22, activity: "Walking to the office", pauseSeconds: 0 },
      { x: 22, z: 19.5, activity: "Starting work", pauseSeconds: 8 },
      { x: 21, z: 22, activity: "Heading out for coffee", pauseSeconds: 0 },
      { x: 18, z: 19, activity: "Getting coffee", pauseSeconds: 7 },
      { x: 16, z: 22, activity: "Returning to work", pauseSeconds: 0 },
    ],
  },
  {
    id: "loop_lunch_runner",
    name: "Lunch Break Walker",
    gender: "female",
    topColor: "#a855f7",
    bottomColor: "#1f2937",
    x: -35,
    z: 13,
    itinerary: [
      { x: -32, z: 13, activity: "Walking to the hot-dog cart", pauseSeconds: 0 },
      { x: -30, z: 14.2, activity: "Ordering lunch", pauseSeconds: 7 },
      { x: -23, z: 14.2, activity: "Walking back to the office", pauseSeconds: 0 },
      { x: -35, z: 13, activity: "Back at work", pauseSeconds: 10 },
    ],
  },
  {
    id: "loop_cta_rider",
    name: "CTA Commuter",
    gender: "male",
    topColor: "#d97706",
    bottomColor: "#374151",
    x: 39,
    z: 41,
    itinerary: [
      { x: 34, z: 41, activity: "Walking to the CTA station", pauseSeconds: 0 },
      { x: 31, z: 38, activity: "Waiting for the train", pauseSeconds: 9 },
      { x: 36, z: 41, activity: "Leaving the station", pauseSeconds: 0 },
      { x: 39, z: 41, activity: "Heading to an appointment", pauseSeconds: 6 },
    ],
  },
  {
    id: "loop_market_shopper",
    name: "Loop Shopper",
    gender: "female",
    topColor: "#be123c",
    bottomColor: "#334155",
    x: -35,
    z: 10,
    itinerary: [
      { x: -28, z: 10, activity: "Walking to the shopping district", pauseSeconds: 0 },
      { x: -25, z: 12, activity: "Browsing the storefronts", pauseSeconds: 8 },
      { x: -32, z: 12, activity: "Walking home with shopping", pauseSeconds: 0 },
      { x: -35, z: 10, activity: "Taking a short break", pauseSeconds: 6 },
    ],
  },
];

export const STREET_OBSTACLES = [
  { minX: 22.35, maxX: 25.65, minZ: 15.15, maxZ: 16.85 },
  { minX: -31.1, maxX: -28.9, minZ: 16.2, maxZ: 17.8 },
  { minX: 42.7, maxX: 44.3, minZ: 36, maxZ: 37 },
  { minX: 22.9, maxX: 25.1, minZ: 14.4, maxZ: 15.2 },
  { minX: 23.35, maxX: 24.65, minZ: 14.65, maxZ: 15.55 },
  { minX: -30.7, maxX: -29.3, minZ: 15.65, maxZ: 16.55 },
  { minX: 41.85, maxX: 43.05, minZ: 35.9, maxZ: 37.1 },
] as const;

// Hostile Street NPC Configurations (Cultists and Smokers - Step 6)
export type HostileNPCType = "cultist" | "smoker";

export type HostileNPCState = {
  id: string;
  name: string;
  type: HostileNPCType;
  x: number;
  z: number;
  rot: number;
  health: number;
  isAggro: boolean;
  targetPlayerId: string;
};

export const INITIAL_HOSTILE_NPCS: HostileNPCState[] = [
  {
    id: "cultist_1",
    name: "Hooded Chicago Cultist",
    type: "cultist",
    x: -18,
    z: 32,
    rot: 0,
    health: 100,
    isAggro: false,
    targetPlayerId: "",
  },
  {
    id: "cultist_2",
    name: "Cermak Cryptic Cultist",
    type: "cultist",
    x: 38,
    z: 38,
    rot: 1.2,
    health: 100,
    isAggro: false,
    targetPlayerId: "",
  },
  {
    id: "smoker_1",
    name: "Corner Hustler / Smoker",
    type: "smoker",
    x: -14,
    z: -18,
    rot: -0.8,
    health: 100,
    isAggro: false,
    targetPlayerId: "",
  },
  {
    id: "smoker_2",
    name: "Alleyway Thug / Smoker",
    type: "smoker",
    x: 52,
    z: -8,
    rot: 2.1,
    health: 100,
    isAggro: false,
    targetPlayerId: "",
  },
];
