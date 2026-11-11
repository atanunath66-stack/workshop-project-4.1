export interface LocationItem {
  city: string;
  district: string;
  area: string;
  landmark: string;
  hotspots: string;
  popularDishTag: string;
  state: 'Karnataka' | 'Other';
  lat?: number;
  lng?: number;
}

export const KARNATAKA_LOCATIONS: LocationItem[] = [
  // ==========================================
  // 1. TUMAKURU (TUMKUR) - Prime Spotlight
  // ==========================================
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Kyatsandra',
    landmark: 'NH 48 Kyatsandra Circle · Iconic Thatte Idli Belt',
    hotspots: 'World Famous Thatte Idli · Kyatsandra Spicy Red Chutney',
    popularDishTag: 'Kyatsandra Thatte Idli & Butter',
    state: 'Karnataka',
    lat: 13.3134,
    lng: 77.1623,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'MG Road & Town Hall',
    landmark: 'Town Hall Circle & Ashoka Road Crossing',
    hotspots: 'Tumkur Street Food Walk · Crispy Mirchi Bajjis',
    popularDishTag: 'Tumkur Chilly Bajji & Filter Kaapi',
    state: 'Karnataka',
    lat: 13.3409,
    lng: 77.101,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Siddaganga Math Road',
    landmark: 'Kyathsandra Gate · Sri Siddaganga Kshetra',
    hotspots: 'Pure Vegetarian Satvik Kitchens · Fresh Avalakki',
    popularDishTag: 'Satvik Mudde Oota & Avalakki',
    state: 'Karnataka',
    lat: 13.3228,
    lng: 77.1475,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Mandipet & Gubbi Gate',
    landmark: 'Old City Wholesale Grain Market & Gandhi Statue',
    hotspots: 'Heritage Spice Hub · Authentic Karnataka Crispy Dosa',
    popularDishTag: 'Mandipet Benne Dosa & Girmit',
    state: 'Karnataka',
    lat: 13.3421,
    lng: 77.0987,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'B.H. Road & Batawadi',
    landmark: 'Bangalore-Honnavar Highway & KSRTC Central Stand',
    hotspots: '24/7 Highway Dhabas & South Indian Tiffins',
    popularDishTag: 'Set Dosa & Nati Koli Saaru',
    state: 'Karnataka',
    lat: 13.3367,
    lng: 77.1089,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'SIT College Main Road',
    landmark: 'Siddharthanagar & SIT Engineering Campus',
    hotspots: 'Student Food Street · Shawarma, Rolls & Thick Shakes',
    popularDishTag: 'Kathi Rolls & Cold Cold Shakes',
    state: 'Karnataka',
    lat: 13.3289,
    lng: 77.1256,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Tiptur',
    landmark: 'Copra Mandi Road & Kalpataru College Circle',
    hotspots: 'Coconut Capital · Traditional Benne Dosa & Khara Buns',
    popularDishTag: 'Tiptur Coconut Holige & Benne Dosa',
    state: 'Karnataka',
    lat: 13.2625,
    lng: 76.4789,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Kunigal',
    landmark: 'Kunigal Stud Farm Junction & NH 75 Highway',
    hotspots: 'Kunigal Kere Food Stalls · Fresh Maddur Vada',
    popularDishTag: 'Kunigal Maddur Vada & Tea',
    state: 'Karnataka',
    lat: 13.0234,
    lng: 77.0345,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Sira',
    landmark: 'Malik Rihan Dargah Road & NH 48 Bypass',
    hotspots: 'Heritage Mughal Dhabas & North Karnataka Rotti',
    popularDishTag: 'Sira Dum Biryani & Jolada Rotti',
    state: 'Karnataka',
    lat: 13.7456,
    lng: 76.9067,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Madhugiri',
    landmark: 'Monolith Fort Base & Market Road',
    hotspots: 'Historic Hill Stalls · Spicy Kaalu Saaru & Mudde',
    popularDishTag: 'Ragi Mudde & Kaalu Saaru',
    state: 'Karnataka',
    lat: 13.6634,
    lng: 77.2089,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Pavagada',
    landmark: 'Solar Park Road & Fort Cross',
    hotspots: 'Border Spice Delights · Peanut Khara Mixture',
    popularDishTag: 'Pavagada Spicy Peanut Mixture',
    state: 'Karnataka',
    lat: 14.1012,
    lng: 77.2834,
  },
  {
    city: 'Tumakuru (Tumkur)',
    district: 'Tumakuru',
    area: 'Gubbi',
    landmark: 'Channabasaveshwara Temple Street',
    hotspots: 'Traditional Village Eateries & Filter Coffee',
    popularDishTag: 'Rava Idli & Shavige Bath',
    state: 'Karnataka',
    lat: 13.3112,
    lng: 76.9412,
  },

  // ==========================================
  // 2. BENGALURU URBAN & RURAL
  // ==========================================
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Koramangala',
    landmark: '4th Block, 80 Feet Road & Sony Signal',
    hotspots: 'Street Food Hub · Late Night Rolls & Artisan Cafés',
    popularDishTag: 'Chaat & Kathi Rolls',
    state: 'Karnataka',
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Indiranagar',
    landmark: '100 Feet Road & 12th Main',
    hotspots: 'Artisanal Cafes · Sigri Kebabs & Microbreweries',
    popularDishTag: 'Wood-fired Sourdough & Kebabs',
    state: 'Karnataka',
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Malleshwaram',
    landmark: 'Sampige Road & CTR (Shri Sagar) Lane',
    hotspots: 'Iconic South Indian Heritage · Benne Masala Dosa',
    popularDishTag: 'CTR Benne Dosa & Filter Kaapi',
    state: 'Karnataka',
    lat: 13.0031,
    lng: 77.5643,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Basavanagudi & Gandhi Bazaar',
    landmark: 'DVG Road & Vidyarthi Bhavan Lane',
    hotspots: 'Classic Brahmin Coffee Houses & Kadalekai Parishe',
    popularDishTag: 'Vidyarthi Bhavan Masala Dosa',
    state: 'Karnataka',
    lat: 12.9421,
    lng: 77.5756,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Jayanagar',
    landmark: '4th Block Complex & 9th Block Food Street',
    hotspots: 'Traditional Karnataka Eateries & Street Chaats',
    popularDishTag: 'Congress Kadlekai & Bajjis',
    state: 'Karnataka',
    lat: 12.9299,
    lng: 77.5824,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Church Street & MG Road',
    landmark: 'MG Road Metro & Brigade Cross',
    hotspots: 'Chai Baithaks · Pastry Bakeries & Indo-Chinese',
    popularDishTag: 'Kulhad Chai & Steak/Pastry',
    state: 'Karnataka',
    lat: 12.9752,
    lng: 77.6067,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Frazer Town / Pulikeshi Nagar',
    landmark: 'Mosque Road & MM Road',
    hotspots: 'Iconic Ramadan Street Delicacies & Charcoal Grills',
    popularDishTag: 'Seekh Kebabs & Mutton Pulao',
    state: 'Karnataka',
    lat: 12.9978,
    lng: 77.6134,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Whitefield',
    landmark: 'ITPL Main Road & Inner Circle',
    hotspots: 'Cosmopolitan Dining · Craft Burgers & Rooftops',
    popularDishTag: 'Pan-Asian Dumplings & Craft Brews',
    state: 'Karnataka',
    lat: 12.9698,
    lng: 77.7499,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'HSR Layout',
    landmark: '27th Main & Sector 1-7 HSR',
    hotspots: 'Startup Cafes & Modern Pan-Indian Street Eats',
    popularDishTag: 'Momos, Biryani & Nitro Brews',
    state: 'Karnataka',
    lat: 12.9121,
    lng: 77.6446,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Rajajinagar',
    landmark: '1st Block & Dr. Rajkumar Road',
    hotspots: 'Udupi Upahar Hubs & Davanagere Benne Dosa Outlets',
    popularDishTag: 'Crispy Benne Dosa & Khara Bath',
    state: 'Karnataka',
    lat: 12.9915,
    lng: 77.5524,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Banashankari',
    landmark: 'BSK 2nd & 3rd Stage · BDA Complex',
    hotspots: 'Traditional South Indian Sweets & Dosa Hubs',
    popularDishTag: 'Open Butter Masala Dosa',
    state: 'Karnataka',
    lat: 12.9255,
    lng: 77.5468,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Electronic City',
    landmark: 'Phase 1 Neeladri Road & Infosys Gate',
    hotspots: 'Quick Bites · Andhra Messes & Street Chaat',
    popularDishTag: 'Andhra Meal & Hyderabadi Biryani',
    state: 'Karnataka',
    lat: 12.8452,
    lng: 77.6602,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    area: 'Yelahanka',
    landmark: 'New Town Kogilu Cross & Sandeep Unnikrishnan Rd',
    hotspots: 'Open Air Garden Dhabas & Nati Style Eateries',
    popularDishTag: 'Nati Style Chicken & Ragi Mudde',
    state: 'Karnataka',
    lat: 13.1007,
    lng: 77.5963,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Rural',
    area: 'Nelamangala',
    landmark: 'NH 48 Toll & Kunigal Highway Split',
    hotspots: 'Famous Highway Thatte Idli Stalls & Pure Ghee Dosa',
    popularDishTag: 'Highway Thatte Idli & Vada',
    state: 'Karnataka',
    lat: 13.0988,
    lng: 77.3912,
  },
  {
    city: 'Bengaluru',
    district: 'Bengaluru Rural',
    area: 'Devanahalli',
    landmark: 'Tipu Birthplace Heritage Fort & Airport Road',
    hotspots: 'Highway Dhabas & Traditional Rayasandra Tiffin',
    popularDishTag: 'Akki Rotti & Coconut Chutney',
    state: 'Karnataka',
    lat: 13.2483,
    lng: 77.7126,
  },

  // ==========================================
  // 3. MYSURU (MYSORE)
  // ==========================================
  {
    city: 'Mysuru',
    district: 'Mysuru',
    area: 'Devaraja Market & Sayyaji Rao Rd',
    landmark: 'Near Mysore Palace & Dufferin Clock Tower',
    hotspots: 'Centuries-old Mysore Pak & Street Bajjis',
    popularDishTag: 'Original Ghee Mysore Pak',
    state: 'Karnataka',
    lat: 12.3087,
    lng: 76.6531,
  },
  {
    city: 'Mysuru',
    district: 'Mysuru',
    area: 'Nazarbad & Agrahara',
    landmark: 'Vinayaka Mylari Hotel Lane',
    hotspots: 'World Famous Mylari Butter Dosa & Sagu',
    popularDishTag: 'Original Mylari Dosa with White Butter',
    state: 'Karnataka',
    lat: 12.3034,
    lng: 76.6645,
  },
  {
    city: 'Mysuru',
    district: 'Mysuru',
    area: 'Gokulam & Jayalakshmipuram',
    landmark: 'Kalidasa Road & 3rd Stage Gokulam',
    hotspots: 'Yoga Hub Cafes, Sourdough Bakeries & Filter Kaapi',
    popularDishTag: 'Artisan Filter Coffee & Dosa',
    state: 'Karnataka',
    lat: 12.3256,
    lng: 76.6321,
  },
  {
    city: 'Mysuru',
    district: 'Mysuru',
    area: 'Nanjangud',
    landmark: 'Srikanteshwara Temple Car Street',
    hotspots: 'Temple Town Cuisine · Nanjangud Rasabale Banana Treats',
    popularDishTag: 'Nanjangud Rasabale & Temple Prasadam',
    state: 'Karnataka',
    lat: 12.1189,
    lng: 76.6812,
  },

  // ==========================================
  // 4. MANGALURU & DAKSHINA KANNADA
  // ==========================================
  {
    city: 'Mangaluru',
    district: 'Dakshina Kannada',
    area: 'Hampankatta & KS Rao Road',
    landmark: 'Ideal Ice Cream Parlour & Pabbas Circle',
    hotspots: 'Legendary Pabbas Gadbad & Chicken Ghee Roast',
    popularDishTag: 'Pabbas Gadbad Ice Cream & Ghee Roast',
    state: 'Karnataka',
    lat: 12.8698,
    lng: 74.8431,
  },
  {
    city: 'Mangaluru',
    district: 'Dakshina Kannada',
    area: 'Kadri & Bejai',
    landmark: 'Kadri Manjunatha Temple Cross & KSRTC Stand',
    hotspots: 'Authentic Tuluva Breakfast · Neer Dosa & Mangalore Buns',
    popularDishTag: 'Mangalore Buns & Kori Rotti',
    state: 'Karnataka',
    lat: 12.8845,
    lng: 74.8567,
  },
  {
    city: 'Mangaluru',
    district: 'Dakshina Kannada',
    area: 'Bunder & Old Port',
    landmark: 'Fish Wharf & Azizuddin Road',
    hotspots: 'Fresh Coastal Seafood Grills & Anjal Fry',
    popularDishTag: 'Anjal Tawa Fry & Kane Curry',
    state: 'Karnataka',
    lat: 12.8612,
    lng: 74.8345,
  },
  {
    city: 'Mangaluru',
    district: 'Dakshina Kannada',
    area: 'Puttur',
    landmark: 'Mahalingeshwara Temple Car Street',
    hotspots: 'Traditional Arecanut Belt Malnad Treats',
    popularDishTag: 'Puttur Kattu & Coastal Samosa',
    state: 'Karnataka',
    lat: 12.7645,
    lng: 75.2012,
  },

  // ==========================================
  // 5. UDUPI
  // ==========================================
  {
    city: 'Udupi',
    district: 'Udupi',
    area: 'Car Street & Sri Krishna Matha',
    landmark: 'Kanaka Navidwara & Temple Square',
    hotspots: 'Cradle of Udupi Cuisine · Pure Satvik Food Without Onion/Garlic',
    popularDishTag: 'Udupi Saaru, Patrode & Goli Baje',
    state: 'Karnataka',
    lat: 13.3409,
    lng: 74.7421,
  },
  {
    city: 'Udupi',
    district: 'Udupi',
    area: 'Manipal',
    landmark: 'Tiger Circle & MIT Campus Road',
    hotspots: 'International Student Food Street · Shawarmas & Dosa Cafes',
    popularDishTag: 'Shawarma, Buns & Filter Coffee',
    state: 'Karnataka',
    lat: 13.3524,
    lng: 74.7867,
  },
  {
    city: 'Udupi',
    district: 'Udupi',
    area: 'Malpe Beach',
    landmark: 'Sea Walkway & Fishing Harbour',
    hotspots: 'Beachside Coastal Shack Delicacies & Fresh Catch Fry',
    popularDishTag: 'Malpe Prawn Ghee Roast & Fish Fry',
    state: 'Karnataka',
    lat: 13.3567,
    lng: 74.7012,
  },
  {
    city: 'Udupi',
    district: 'Udupi',
    area: 'Kundapura',
    landmark: 'Shastri Circle & Parijata Circle',
    hotspots: 'Birthplace of Chicken Ghee Roast & Koli Saaru',
    popularDishTag: 'Authentic Kundapura Ghee Roast',
    state: 'Karnataka',
    lat: 13.6289,
    lng: 74.6934,
  },

  // ==========================================
  // 6. HUBBALLI-DHARWAD
  // ==========================================
  {
    city: 'Dharwad',
    district: 'Dharwad',
    area: 'Line Bazaar & Subhas Road',
    landmark: 'Mishra Peda & Babusingh Thakur Peda Lane',
    hotspots: 'GI Tagged Dharwad Peda & Spiced Girmit',
    popularDishTag: 'GI Dharwad Peda & Girmit',
    state: 'Karnataka',
    lat: 15.4589,
    lng: 75.0078,
  },
  {
    city: 'Hubballi',
    district: 'Dharwad',
    area: 'Station Road & Koppikar Road',
    landmark: 'Old City Railway Station & Durgadbail',
    hotspots: 'Evening Street Food Bazaar · Mirchi Bajji & Girmit',
    popularDishTag: 'Hubballi Mirchi Bajji & Shengdana Chutney',
    state: 'Karnataka',
    lat: 15.3647,
    lng: 75.124,
  },
  {
    city: 'Hubballi',
    district: 'Dharwad',
    area: 'Vidyanagar & Shirur Park',
    landmark: 'BVB Engineering Campus & Unkal Lake Cross',
    hotspots: 'North Karnataka Jolada Rotti Khanavalis',
    popularDishTag: 'Jolada Rotti Oota & Yennegai',
    state: 'Karnataka',
    lat: 15.3789,
    lng: 75.1123,
  },

  // ==========================================
  // 7. DAVANAGERE
  // ==========================================
  {
    city: 'Davanagere',
    district: 'Davanagere',
    area: 'MCC B Block & Dental College Rd',
    landmark: 'Ravi Benne Dosa & Sri Guru Kottureshwara Dosa',
    hotspots: 'World Famous Davanagere Crisp Butter Dosa & Potato Palya',
    popularDishTag: 'Original Davanagere Benne Dosa',
    state: 'Karnataka',
    lat: 14.4645,
    lng: 75.9212,
  },
  {
    city: 'Davanagere',
    district: 'Davanagere',
    area: 'Gandhi Circle & Mandipet',
    landmark: 'Clock Tower & Old Grain Market',
    hotspots: 'Fiery Mandakki Usli & Menasinakai Bajjis',
    popularDishTag: 'Davanagere Mandakki Usli & Bajji',
    state: 'Karnataka',
    lat: 14.4689,
    lng: 75.9189,
  },
  {
    city: 'Davanagere',
    district: 'Davanagere',
    area: 'Harihar',
    landmark: 'Harihareshwara Temple & PB Road',
    hotspots: 'Tungabhadra Riverside Traditional Tiffin & Dhabas',
    popularDishTag: 'Benne Dosa & Filter Coffee',
    state: 'Karnataka',
    lat: 14.5123,
    lng: 75.8034,
  },

  // ==========================================
  // 8. BELAGAVI (BELGAUM)
  // ==========================================
  {
    city: 'Belagavi',
    district: 'Belagavi',
    area: 'Kirloskar Road & Camp',
    landmark: 'Alankar Cinema Circle & Ramdev Galli',
    hotspots: 'Home of Iconic Belgaum Kunda & Milk Sweets',
    popularDishTag: 'Original Belgaum Kunda & Churi Muri',
    state: 'Karnataka',
    lat: 15.8497,
    lng: 74.4977,
  },
  {
    city: 'Belagavi',
    district: 'Belagavi',
    area: 'Tilakwadi & Shahapur',
    landmark: 'Congress Road & Khanapur Road',
    hotspots: 'Maratha & Kannada Fusion · Kolhapuri Bhel & Jolada Rotti',
    popularDishTag: 'Jolada Rotti & Zunka Bhakar',
    state: 'Karnataka',
    lat: 15.8345,
    lng: 74.5089,
  },
  {
    city: 'Belagavi',
    district: 'Belagavi',
    area: 'Gokak',
    landmark: 'Gokak Falls Road & Raviwar Peth',
    hotspots: 'World Famous Gokak Karadantu (Nut & Jaggery Delight)',
    popularDishTag: 'Gokak Karadantu & Laddu',
    state: 'Karnataka',
    lat: 16.1689,
    lng: 74.8234,
  },

  // ==========================================
  // 9. SHIVAMOGGA (SHIMOGA)
  // ==========================================
  {
    city: 'Shivamogga',
    district: 'Shivamogga',
    area: 'Durgigudi & Gopi Circle',
    landmark: 'Ashoka Hotel Cross & Nehru Road',
    hotspots: 'Heart of Malnad Delicacies · Akki Rotti & Midigayi Pickle',
    popularDishTag: 'Malnad Akki Rotti & Kaayi Chutney',
    state: 'Karnataka',
    lat: 13.9299,
    lng: 75.5681,
  },
  {
    city: 'Shivamogga',
    district: 'Shivamogga',
    area: 'Sagar & Jog Falls Road',
    landmark: 'Marikamba Temple Road',
    hotspots: 'Steamed Halasina Hannina Kadubu (Jackfruit cakes)',
    popularDishTag: 'Halasina Kadubu & Neer Dosa',
    state: 'Karnataka',
    lat: 14.1678,
    lng: 75.0345,
  },
  {
    city: 'Shivamogga',
    district: 'Shivamogga',
    area: 'Thirthahalli',
    landmark: 'Tunga River Bridge & Soppugudde',
    hotspots: 'Traditional Havyaka Cuisine & Malnad Filter Coffee',
    popularDishTag: 'Kotte Kadubu & Appe Midi Pickle',
    state: 'Karnataka',
    lat: 13.6989,
    lng: 75.2345,
  },

  // ==========================================
  // 10. VIJAYAPURA (BIJAPUR)
  // ==========================================
  {
    city: 'Vijayapura',
    district: 'Vijayapura',
    area: 'Gandhi Chowk & Station Road',
    landmark: 'Near Gol Gumbaz & Citadel Gate',
    hotspots: 'North Karnataka Staple Capital · Paper-thin Jolada Rotti',
    popularDishTag: 'Jolada Rotti, Yennegai & Shenga Chutney',
    state: 'Karnataka',
    lat: 16.8302,
    lng: 75.71,
  },

  // ==========================================
  // 11. KALABURAGI (GULBARGA)
  // ==========================================
  {
    city: 'Kalaburagi',
    district: 'Kalaburagi',
    area: 'Super Market & Jagat Circle',
    landmark: 'Old City Fort & Station Road',
    hotspots: 'Famous Gulbarga Malpuri & Authentic Mutton Tahari',
    popularDishTag: 'Gulbarga Malpuri & Tahari Biryani',
    state: 'Karnataka',
    lat: 17.3297,
    lng: 76.8343,
  },

  // ==========================================
  // 12. BALLARI (BELLARY)
  // ==========================================
  {
    city: 'Ballari',
    district: 'Ballari',
    area: 'Station Road & Car Street',
    landmark: 'Royal Circle & Old Fort Rock',
    hotspots: 'Ballari Special Cycle Khara, Mirchi Bajji & Dosa',
    popularDishTag: 'Ballari Cycle Khara & Mirchi Bajji',
    state: 'Karnataka',
    lat: 15.1394,
    lng: 76.9214,
  },

  // ==========================================
  // 13. HASSAN
  // ==========================================
  {
    city: 'Hassan',
    district: 'Hassan',
    area: 'Sampige Road & BM Road',
    landmark: 'Hassan Bus Stand & Dairy Circle',
    hotspots: 'Rustic Ragi Mudde, Kaalu Saaru & Akki Roti',
    popularDishTag: 'Ragi Mudde, Kaalu Saaru & Nati Koli',
    state: 'Karnataka',
    lat: 13.0033,
    lng: 76.1004,
  },
  {
    city: 'Hassan',
    district: 'Hassan',
    area: 'Sakleshpur',
    landmark: 'Hemavathi River Bridge & BM Highway',
    hotspots: 'Hill Station Malnad Spice Kitchens & Arabica Coffee',
    popularDishTag: 'Malnad Bamboo Shoot & Akki Rotti',
    state: 'Karnataka',
    lat: 12.9432,
    lng: 75.7865,
  },

  // ==========================================
  // 14. MANDYA
  // ==========================================
  {
    city: 'Mandya',
    district: 'Mandya',
    area: 'VV Road & Sugar Factory',
    landmark: 'Near Mandya Bus Stand & Highway Cross',
    hotspots: 'Sugar City · Jaggery Delights & Country Style Nati Oota',
    popularDishTag: 'Organic Jaggery Sweets & Ragi Mudde',
    state: 'Karnataka',
    lat: 12.5233,
    lng: 76.8974,
  },
  {
    city: 'Mandya',
    district: 'Mandya',
    area: 'Maddur',
    landmark: 'Maddur Tiffanys & Old Railway Station Highway',
    hotspots: 'Original Birthplace of the World Famous Maddur Vada',
    popularDishTag: 'Original Crispy Maddur Vada',
    state: 'Karnataka',
    lat: 12.5845,
    lng: 77.0456,
  },
  {
    city: 'Mandya',
    district: 'Mandya',
    area: 'Srirangapatna',
    landmark: 'Kaveri River Sangam & Ranganathaswamy Temple',
    hotspots: 'River Catch Fish Fry & Heritage Brahmin Tiffin',
    popularDishTag: 'Kaveri Fresh Fish Fry & Filter Coffee',
    state: 'Karnataka',
    lat: 12.4189,
    lng: 76.6945,
  },

  // ==========================================
  // 15. CHIKKAMAGALURU (CHIKMAGALUR)
  // ==========================================
  {
    city: 'Chikkamagaluru',
    district: 'Chikkamagaluru',
    area: 'IG Road & Market Road',
    landmark: 'Near Bus Stand & Clock Tower',
    hotspots: 'Coffee Capital of India · Fresh Roast Filter Kaapi & Malnad Oota',
    popularDishTag: 'Fresh Single Estate Filter Coffee & Akki Rotti',
    state: 'Karnataka',
    lat: 13.3161,
    lng: 75.772,
  },
  {
    city: 'Chikkamagaluru',
    district: 'Chikkamagaluru',
    area: 'Sringeri & Mudigere',
    landmark: 'Sharadamba Temple Street & Mudigere Town',
    hotspots: 'Sacred Temple Annadana & Spiced Cardamom Delights',
    popularDishTag: 'Temple Prasada & Cardamom Kaapi',
    state: 'Karnataka',
    lat: 13.4189,
    lng: 75.2567,
  },

  // ==========================================
  // 16. KODAGU (COORG - MADIKERI)
  // ==========================================
  {
    city: 'Madikeri (Coorg)',
    district: 'Kodagu',
    area: 'Raja Seat Road & College Road',
    landmark: 'Near Raja Seat Sunset Point & Madikeri Fort',
    hotspots: 'Authentic Kodava Kitchen · Kadambuttu, Akki Rotti & Pandi Curry',
    popularDishTag: 'Authentic Kodava Kadambuttu & Pandi Curry',
    state: 'Karnataka',
    lat: 12.4244,
    lng: 75.7382,
  },
  {
    city: 'Kushalnagar (Coorg)',
    district: 'Kodagu',
    area: 'Bylakuppe Tibetan Camp',
    landmark: 'Golden Temple Monastery Road',
    hotspots: 'Tibetan Dumplings, Steamed Momos & Thukpa',
    popularDishTag: 'Steamed Tingmo & Tibetan Momos',
    state: 'Karnataka',
    lat: 12.4567,
    lng: 75.9678,
  },

  // ==========================================
  // 17. CHITRADURGA
  // ==========================================
  {
    city: 'Chitradurga',
    district: 'Chitradurga',
    area: 'Fort Road & Holalkere Road',
    landmark: 'Chitradurga Stone Fort Gate (Kallina Kote)',
    hotspots: 'Historic Palegara Kitchens · Crispy Masala Dosa & Shenga Holige',
    popularDishTag: 'Chitradurga Benne Dosa & Shenga Holige',
    state: 'Karnataka',
    lat: 14.2251,
    lng: 76.398,
  },

  // ==========================================
  // 18. BAGALKOTE
  // ==========================================
  {
    city: 'Bagalkote',
    district: 'Bagalkote',
    area: 'Navanagar & Badami Heritage',
    landmark: 'Sector Area & Badami Cave Temples Cross',
    hotspots: 'North Karnataka Spiced Jowar Thali & Ilkal Sweets',
    popularDishTag: 'Jolada Rotti Oota & Badami Mixture',
    state: 'Karnataka',
    lat: 16.1856,
    lng: 75.6989,
  },

  // ==========================================
  // 19. BIDAR
  // ==========================================
  {
    city: 'Bidar',
    district: 'Bidar',
    area: 'Old City & Bahmani Fort',
    landmark: 'Mahmud Gawan Madrasa Cross & Gumpa Road',
    hotspots: 'Deccan Royal Flavours · Dum Biryani, Naan Qalia & Malida',
    popularDishTag: 'Bidar Dum Biryani & Naan Qalia',
    state: 'Karnataka',
    lat: 17.9104,
    lng: 77.5199,
  },

  // ==========================================
  // 20. RAICHUR
  // ==========================================
  {
    city: 'Raichur',
    district: 'Raichur',
    area: 'Station Road & Teen Kandel',
    landmark: 'Clock Tower & Old Fort Area',
    hotspots: 'Spiced Mirchi Bajjis, Susla (Spiced puffed rice) & Jowar Thali',
    popularDishTag: 'Raichur Susla & Mirchi Bajji',
    state: 'Karnataka',
    lat: 16.2076,
    lng: 77.3463,
  },

  // ==========================================
  // 21. VIJAYANAGARA & KOPPAL (HAMPI / HOSPET)
  // ==========================================
  {
    city: 'Hospet (Vijayanagara)',
    district: 'Vijayanagara',
    area: 'Station Road & Hampi Bazaar',
    landmark: 'Virupaksha Temple Footsteps & Tungabhadra Dam Cross',
    hotspots: 'Heritage Vijayanagara Thalis, Fresh Mango Shakes & South Indian Meals',
    popularDishTag: 'Royal Vijayanagara Thali & Lassi',
    state: 'Karnataka',
    lat: 15.2689,
    lng: 76.3912,
  },
  {
    city: 'Gangavathi',
    district: 'Koppal',
    area: 'Main Road & Rice Mill Hub',
    landmark: 'CBS Circle & Anekundi Cross',
    hotspots: 'Rice Bowl of Karnataka · Sona Masoori Rice Dishes & Rotti',
    popularDishTag: 'Fresh Sona Masoori Rice Delicacies',
    state: 'Karnataka',
    lat: 15.4312,
    lng: 76.5289,
  },

  // ==========================================
  // 22. GADAG-BETAGERI
  // ==========================================
  {
    city: 'Gadag',
    district: 'Gadag',
    area: 'Pala Badami Road & Namjoshi Rd',
    landmark: 'Trikuteshwara Temple Road & Mulgund Naka',
    hotspots: 'Traditional Gadag Avalakki, Girmit & Mirchi Bajji',
    popularDishTag: 'Gadag Avalakki & Girmit',
    state: 'Karnataka',
    lat: 15.4289,
    lng: 75.6345,
  },

  // ==========================================
  // 23. HAVERI
  // ==========================================
  {
    city: 'Haveri',
    district: 'Haveri',
    area: 'PB Road & Byadgi Cross',
    landmark: 'Haveri Central Circle & Byadgi Chilli Market',
    hotspots: 'World Famous Byadgi Chilli Spiced Snacks & Haveri Rotti',
    popularDishTag: 'Byadgi Mirchi Bajji & Benne Dosa',
    state: 'Karnataka',
    lat: 14.7956,
    lng: 75.3989,
  },

  // ==========================================
  // 24. UTTARA KANNADA (KARWAR / GOKARNA / SIRSI)
  // ==========================================
  {
    city: 'Karwar',
    district: 'Uttara Kannada',
    area: 'Sea Face & Main Market',
    landmark: 'Rabindranath Tagore Beach & Kodibag',
    hotspots: 'Karwari Coastal Seafood · Tisryo (Clams) Sukka & Sol Kadi',
    popularDishTag: 'Karwari Fish Curry & Sol Kadi',
    state: 'Karnataka',
    lat: 14.8134,
    lng: 74.1298,
  },
  {
    city: 'Gokarna',
    district: 'Uttara Kannada',
    area: 'Car Street & Kudle Beach',
    landmark: 'Mahabaleshwar Temple & Kudle Hilltop',
    hotspots: 'Temple Prasadam & Coastal Seafood Grills',
    popularDishTag: 'Neer Dosa & Fresh Tawa Fish',
    state: 'Karnataka',
    lat: 14.5478,
    lng: 74.3189,
  },
  {
    city: 'Sirsi',
    district: 'Uttara Kannada',
    area: 'Market Road & Marikamba Temple',
    landmark: 'Old Arecanut Mandi & Temple Square',
    hotspots: 'Traditional Todadeya (wafer sweet) & Kotte Kadubu',
    popularDishTag: 'Sirsi Todadeya & Jackfruit Kadubu',
    state: 'Karnataka',
    lat: 14.6189,
    lng: 74.8467,
  },

  // ==========================================
  // 25. KOLAR
  // ==========================================
  {
    city: 'Kolar',
    district: 'Kolar',
    area: 'Clock Tower & MB Road',
    landmark: 'Old City Center & Antaragange Foothills',
    hotspots: 'Famous Kolar Milk Peda, Benne Murukku & Dosa',
    popularDishTag: 'Kolar Milk Peda & Benne Murukku',
    state: 'Karnataka',
    lat: 13.1367,
    lng: 78.1345,
  },
  {
    city: 'Bangarapet',
    district: 'Kolar',
    area: 'Railway Station Road',
    landmark: 'Town Hall Circle & Railway Junction',
    hotspots: 'Original Home of the Famous Bangarapet White Chutney Pani Puri',
    popularDishTag: 'Original Bangarapet White Pani Puri',
    state: 'Karnataka',
    lat: 12.9789,
    lng: 78.2012,
  },

  // ==========================================
  // 26. CHIKKABALLAPURA
  // ==========================================
  {
    city: 'Chikkaballapura',
    district: 'Chikkaballapura',
    area: 'BB Road & Nandi Hills Cross',
    landmark: 'Bhoga Nandeeshwara Temple Road & Highway Split',
    hotspots: 'Nandi Hills Roadside Dhabas & Traditional Tiffin',
    popularDishTag: 'Gauribidanur Thindi & Filter Coffee',
    state: 'Karnataka',
    lat: 13.4356,
    lng: 77.7289,
  },
  {
    city: 'Chintamani',
    district: 'Chikkaballapura',
    area: 'MG Road & Peanut Market',
    landmark: 'Chintamani Bus Stand & Azad Chowk',
    hotspots: 'Famous Chintamani Spiced Peanuts & Masala Avalakki',
    popularDishTag: 'Chintamani Masala Peanuts & Chaat',
    state: 'Karnataka',
    lat: 13.4012,
    lng: 78.0567,
  },

  // ==========================================
  // 27. RAMANAGARA
  // ==========================================
  {
    city: 'Ramanagara',
    district: 'Ramanagara',
    area: 'Ijoor & Expressway Corridor',
    landmark: 'Bengaluru-Mysuru Expressway & Sholay Hills Cross',
    hotspots: 'Ramanagara Thatte Idli, Mysore Pak & Highway Dhabas',
    popularDishTag: 'Ramanagara Thatte Idli & Vada',
    state: 'Karnataka',
    lat: 12.7212,
    lng: 77.2812,
  },
  {
    city: 'Channapatna',
    district: 'Ramanagara',
    area: 'Toy Town Highway & Station Rd',
    landmark: 'Craft Center & Bengaluru-Mysuru Highway',
    hotspots: 'Famous Channapatna Mysore Pak & Masala Dosa',
    popularDishTag: 'Ghee Mysore Pak & Masala Dosa',
    state: 'Karnataka',
    lat: 12.6512,
    lng: 77.2034,
  },

  // ==========================================
  // 28. YADGIR
  // ==========================================
  {
    city: 'Yadgir',
    district: 'Yadgir',
    area: 'Station Road & Gandhi Chowk',
    landmark: 'Old Fort Rock & Bus Stand Circle',
    hotspots: 'Rustic Deccan Jolada Rotti Oota & Shenga Chutney',
    popularDishTag: 'Jolada Rotti Oota & Shenga Chutney',
    state: 'Karnataka',
    lat: 16.7645,
    lng: 77.1345,
  },

  // ==========================================
  // 29. CHAMARAJANAGAR
  // ==========================================
  {
    city: 'Chamarajanagar',
    district: 'Chamarajanagar',
    area: 'Gundlupet & Kollegal Cross',
    landmark: 'Bandipur Highway Junction & Chamarajeshwara Temple',
    hotspots: 'Forest Border Delights · Kaalu Saaru, Ragi Rōti & Wild Honey Treats',
    popularDishTag: 'Ragi Rōti & Kaalu Saaru',
    state: 'Karnataka',
    lat: 11.9261,
    lng: 76.9437,
  },

  // ==========================================
  // OTHER PAN-INDIA CITIES (FOR TRAVEL & DISCOVERY)
  // ==========================================
  {
    city: 'Kolkata',
    district: 'Kolkata',
    area: 'Park Street',
    landmark: 'Heritage Eateries & Flurys Lane',
    hotspots: 'Classic Continental & Kathi Rolls',
    popularDishTag: 'Egg-Chicken Kathi Roll',
    state: 'Other',
  },
  {
    city: 'Kolkata',
    district: 'Kolkata',
    area: 'Gariahat',
    landmark: 'Ballygunge Phari Crossing',
    hotspots: 'Bengali Delicacies & Telebhaja',
    popularDishTag: 'Fish Fry & Singara',
    state: 'Other',
  },
  {
    city: 'Mumbai',
    district: 'Mumbai',
    area: 'Bandra West',
    landmark: 'Hill Road & Pali Village',
    hotspots: 'Seafront Cafes & Kebabs',
    popularDishTag: 'Frankies & Vada Pav',
    state: 'Other',
  },
  {
    city: 'Delhi NCR',
    district: 'Delhi',
    area: 'Chandni Chowk',
    landmark: 'Paranthe Wali Gali & Jama Masjid',
    hotspots: 'Centuries-old Mughlai & Chaat',
    popularDishTag: 'Aloo Tikki & Rabri Jalebi',
    state: 'Other',
  },
  {
    city: 'Hyderabad',
    district: 'Hyderabad',
    area: 'Charminar & Old City',
    landmark: 'Madina Circle & Nimrah Cafe',
    hotspots: 'Hyderabadi Dum Biryani & Irani Chai with Osmania Biscuits',
    popularDishTag: 'Irani Chai & Mutton Biryani',
    state: 'Other',
  },
  {
    city: 'Chennai',
    district: 'Chennai',
    area: 'Mylapore',
    landmark: 'Kapaleeshwarar Temple Street',
    hotspots: 'Authentic Filter Coffee & Ghee Podi Dosa',
    popularDishTag: 'Ghee Podi Dosa & Filter Kaapi',
    state: 'Other',
  },
];

export const KARNATAKA_DISTRICTS = [
  'Tumakuru',
  'Bengaluru Urban',
  'Bengaluru Rural',
  'Mysuru',
  'Dakshina Kannada',
  'Udupi',
  'Dharwad',
  'Davanagere',
  'Belagavi',
  'Shivamogga',
  'Vijayapura',
  'Kalaburagi',
  'Ballari',
  'Hassan',
  'Mandya',
  'Chikkamagaluru',
  'Kodagu',
  'Chitradurga',
  'Bagalkote',
  'Bidar',
  'Raichur',
  'Vijayanagara',
  'Koppal',
  'Gadag',
  'Haveri',
  'Uttara Kannada',
  'Kolar',
  'Chikkaballapura',
  'Ramanagara',
  'Yadgir',
  'Chamarajanagar',
];

export const PRIMARY_REGIONS = [
  'All',
  'Tumakuru (Tumkur)',
  'Bengaluru',
  'Mysuru',
  'Mangaluru & Udupi',
  'Hubballi-Dharwad',
  'Davanagere',
  'Belagavi',
  'Shivamogga',
  'Coastal & Malnad',
  'North Karnataka',
  'Other Cities',
];
