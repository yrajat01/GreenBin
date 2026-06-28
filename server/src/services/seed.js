const Bin = require('../models/Bin');
const User = require('../models/User');
const Report = require('../models/Report');
const Route = require('../models/Route');
const Collection = require('../models/Collection');

const seedData = async () => {
  try {
    // Clear existing data
    await Bin.deleteMany();
    await User.deleteMany();
    await Report.deleteMany();
    await Route.deleteMany();
    await Collection.deleteMany();
    
    console.log('Cleared database collections.');

    // 1. Seed Bins (20 Bins)
    const depotLat = 26.8467;
    const depotLng = 80.9462;
    
    const binsData = [
      // Zone-A bins (normal traffic)
      { binId: 'GB-001', location: { name: 'Sector 14 Main Road', lat: depotLat + 0.005, lng: depotLng + 0.003 }, fillLevel: 25, status: 'normal', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-002', location: { name: 'Sector 14 Gate', lat: depotLat + 0.008, lng: depotLng - 0.005 }, fillLevel: 45, status: 'normal', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-003', location: { name: 'Sector 14 Park', lat: depotLat + 0.012, lng: depotLng + 0.010 }, fillLevel: 65, status: 'warning', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-042', location: { name: 'Market St & 5th (Central Park)', lat: depotLat - 0.006, lng: depotLng - 0.004 }, fillLevel: 94, status: 'critical', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-005', location: { name: 'North Transit Hub', lat: depotLat + 0.015, lng: depotLng - 0.010 }, fillLevel: 98, status: 'critical', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-016', location: { name: 'Sector 17 Apartments', lat: depotLat - 0.010, lng: depotLng + 0.012 }, fillLevel: 15, status: 'normal', zone: 'Zone-A', collectionType: 'sensor' },
      { binId: 'GB-017', location: { name: 'Sector 17 Market', lat: depotLat - 0.015, lng: depotLng - 0.015 }, fillLevel: 30, status: 'normal', zone: 'Zone-A', collectionType: 'sensor' },
      
      // Zone-B bins (normal traffic)
      { binId: 'GB-006', location: { name: 'South Park Entrance', lat: depotLat - 0.008, lng: depotLng + 0.008 }, fillLevel: 92, status: 'critical', zone: 'Zone-B', collectionType: 'sensor' },
      { binId: 'GB-007', location: { name: 'Sector 15 Commercial', lat: depotLat + 0.004, lng: depotLng + 0.012 }, fillLevel: 55, status: 'normal', zone: 'Zone-B', collectionType: 'sensor' },
      { binId: 'GB-008', location: { name: 'Sector 15 Residential (Oak St 42)', lat: depotLat - 0.002, lng: depotLng + 0.006 }, fillLevel: 45, status: 'smell_reported', zone: 'Zone-B', collectionType: 'citizen', lastReported: new Date(Date.now() - 12 * 60 * 1000) },
      { binId: 'GB-009', location: { name: 'Pine Avenue Corner', lat: depotLat + 0.009, lng: depotLng - 0.008 }, fillLevel: 50, status: 'smell_reported', zone: 'Zone-B', collectionType: 'citizen', lastReported: new Date(Date.now() - 60 * 60 * 1000) },
      { binId: 'GB-010', location: { name: 'Sector 16 Shopping', lat: depotLat - 0.012, lng: depotLng - 0.008 }, fillLevel: 10, status: 'normal', zone: 'Zone-B', collectionType: 'sensor' },
      { binId: 'GB-018', location: { name: 'Sector 18 Corner', lat: depotLat + 0.018, lng: depotLng + 0.018 }, fillLevel: 22, status: 'normal', zone: 'Zone-B', collectionType: 'sensor' },
      
      // Zone-C bins (5 low-traffic, 2 normal)
      { binId: 'GB-011', location: { name: 'Suburb Library', lat: depotLat + 0.020, lng: depotLng - 0.020 }, fillLevel: 35, status: 'normal', zone: 'Zone-C', collectionType: 'sensor', lowTraffic: true },
      { binId: 'GB-012', location: { name: 'Suburb Park', lat: depotLat - 0.020, lng: depotLng + 0.020 }, fillLevel: 12, status: 'normal', zone: 'Zone-C', collectionType: 'sensor', lowTraffic: true },
      { binId: 'GB-013', location: { name: 'Suburb Community Center', lat: depotLat + 0.025, lng: depotLng + 0.005 }, fillLevel: 40, status: 'normal', zone: 'Zone-C', collectionType: 'sensor', lowTraffic: true },
      { binId: 'GB-014', location: { name: 'Suburb Lake Path', lat: depotLat - 0.025, lng: depotLng - 0.005 }, fillLevel: 18, status: 'normal', zone: 'Zone-C', collectionType: 'sensor', lowTraffic: true },
      { binId: 'GB-015', location: { name: 'Suburb School', lat: depotLat + 0.002, lng: depotLng - 0.022 }, fillLevel: 28, status: 'normal', zone: 'Zone-C', collectionType: 'sensor', lowTraffic: true },
      { binId: 'GB-019', location: { name: 'Sector 19 Plaza', lat: depotLat - 0.005, lng: depotLng + 0.025 }, fillLevel: 32, status: 'normal', zone: 'Zone-C', collectionType: 'sensor' },
      { binId: 'GB-020', location: { name: 'Sector 20 Crossing', lat: depotLat + 0.010, lng: depotLng - 0.025 }, fillLevel: 14, status: 'normal', zone: 'Zone-C', collectionType: 'sensor' }
    ];

    await Bin.insertMany(binsData);
    console.log(`Pre-seeded ${binsData.length} bins.`);

    // 2. Seed Users
    const usersData = [
      { uid: 'uid-citizen', name: 'Rajat Yadav', email: 'rajat@greenbin.com', password: '12345678', role: 'citizen', zone: 'Zone-A', points: 120, reportCount: 4, badgesEarned: ['First Report'] },
      { uid: 'uid-ritik', name: 'Ritik Prajapati', email: 'ritik@greenbin.com', password: '12345678', role: 'citizen', zone: 'Zone-A', points: 90, reportCount: 3 },
      { uid: 'uid-anshuman', name: 'Anshuman Shukla', email: 'anshuman@greenbin.com', password: '12345678', role: 'citizen', zone: 'Zone-B', points: 60, reportCount: 2 },
      { uid: 'uid-priyanshu', name: 'Priyanshu Singh', email: 'priyanshu@greenbin.com', password: '12345678', role: 'citizen', zone: 'Zone-B', points: 30, reportCount: 1 },
      { uid: 'uid-devta', name: 'Devta User', email: 'devta@greenbin.com', password: '12345678', role: 'citizen', zone: 'Zone-C', points: 15, reportCount: 0 },
      { uid: 'uid-staff', name: 'Staff Collector', email: 'staff@greenbin.com', password: '12345678', role: 'staff', zone: 'Zone-A', points: 0 },
      { uid: 'uid-admin', name: 'Officer Sarah K.', email: 'admin@greenbin.com', password: '12345678', role: 'admin', zone: 'Zone-A', points: 0 }
    ];

    await User.insertMany(usersData);
    console.log(`Pre-seeded ${usersData.length} users.`);

    // 3. Pre-seed Smell Reports for the 2 smell_reported bins
    const reportsData = [
      {
        reportId: 'TK-2026-0891',
        binId: 'GB-008',
        userId: 'uid-citizen',
        issueType: 'Foul Smell',
        description: 'Noticeable foul smell around Oak Street entrance.',
        status: 'pending',
        createdAt: new Date(Date.now() - 12 * 60 * 1000)
      },
      {
        reportId: 'TK-2026-0892',
        binId: 'GB-009',
        userId: 'uid-ritik',
        issueType: 'Foul Smell',
        description: 'A strong smell is spreading from the bin. Heavy dumping observed.',
        status: 'pending',
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      }
    ];

    await Report.insertMany(reportsData);
    console.log(`Pre-seeded ${reportsData.length} smell reports.`);

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedData;
