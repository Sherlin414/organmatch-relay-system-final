import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './connection.js';
import {
  Hospital,
  Jurisdiction,
  User,
  Vehicle,
  Patient,
} from '../models/index.js';

function randomHlaMarkers() {
  const pool6 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const shuffled = [...pool6].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

export async function seedIfEmpty() {
  const existingCount = await User.countDocuments({});
  if (existingCount > 0) {
    console.log('[Seed] Database already has data — skipping auto-seed.');
    return;
  }
  await runSeed();
}

async function runSeed() {
  // Clear any existing data so re-seeding is idempotent
  await Promise.all([
    Hospital.deleteMany({}),
    Jurisdiction.deleteMany({}),
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    Patient.deleteMany({}),
  ]);

  // ---------- Hospitals ----------
  const stXavier = await Hospital.create({
    name: 'St. Xavier Medical Center',
    location_lat: 13.0827,
    location_lng: 80.2707,
    type: 'donor',
    address: 'Chennai, TN',
  });
  const cityGeneral = await Hospital.create({
    name: 'City General Hospital',
    location_lat: 13.0604,
    location_lng: 80.2496,
    type: 'recipient',
    address: 'Chennai, TN',
  });

  // ---------- Jurisdictions ----------
  const sector12 = await Jurisdiction.create({
    name: 'Sector 12 Traffic Control',
    control_room_contact: '+91 44 2222 1111',
    sequence_hint: 1,
  });
  const sector7 = await Jurisdiction.create({
    name: 'Sector 7 Traffic Control',
    control_room_contact: '+91 44 2222 2222',
    sequence_hint: 2,
  });
  const mgRoad = await Jurisdiction.create({
    name: 'MG Road Junction Control',
    control_room_contact: '+91 44 2222 3333',
    sequence_hint: 3,
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  // ---------- Users ----------
  const doctor = await User.create({
    name: 'Dr. Fatima Rahman',
    email: 'doctor@organmatch.dev',
    password_hash: passwordHash,
    role: 'DOCTOR',
    contact_number: '+91 98450 11122',
    hospital_id: stXavier._id,
    license_number: 'MED-88213',
  });

  await User.create({
    name: 'Kavya Suresh',
    email: 'admin@organmatch.dev',
    password_hash: passwordHash,
    role: 'HOSPITAL_ADMIN',
    contact_number: '+91 90000 11223',
    hospital_id: cityGeneral._id,
  });

  await User.create({
    name: 'Rahul Verma',
    email: 'donor@organmatch.dev',
    password_hash: passwordHash,
    role: 'DONOR_COORDINATOR',
    contact_number: '+91 99887 66554',
    hospital_id: stXavier._id,
  });

  await User.create({
    name: 'Ananya Iyer',
    email: 'sysadmin@organmatch.dev',
    password_hash: passwordHash,
    role: 'SYSTEM_ADMIN',
    contact_number: '+91 91234 56780',
    organization_name: 'National Organ Registry',
  });

  const ambulanceDriver = await User.create({
    name: 'Suresh Kumar',
    email: 'ambulance@organmatch.dev',
    password_hash: passwordHash,
    role: 'AMBULANCE',
    contact_number: '+91 97865 43221',
    license_id: 'DL-44219',
  });

  await User.create({
    name: 'Inspector Vikram Singh',
    email: 'police@organmatch.dev',
    password_hash: passwordHash,
    role: 'POLICE',
    contact_number: '+91 90111 22334',
    station_name: 'Sector 12 Traffic Control',
    jurisdiction_id: sector12._id,
  });

  await User.create({
    name: 'Inspector Meena Pillai',
    email: 'police2@organmatch.dev',
    password_hash: passwordHash,
    role: 'POLICE',
    contact_number: '+91 90111 33445',
    station_name: 'Sector 7 Traffic Control',
    jurisdiction_id: sector7._id,
  });

  await User.create({
    name: 'Inspector Arjun Reddy',
    email: 'police3@organmatch.dev',
    password_hash: passwordHash,
    role: 'POLICE',
    contact_number: '+91 90111 44556',
    station_name: 'MG Road Junction Control',
    jurisdiction_id: mgRoad._id,
  });

  const patientUser = await User.create({
    name: 'Arjun Menon',
    email: 'patient@organmatch.dev',
    password_hash: passwordHash,
    role: 'PATIENT',
    contact_number: '+91 98765 43210',
    organ_needed: 'Kidney',
    blood_type: 'O+',
    urgency_score: 92.4,
    registered_hospital_name: 'City General Hospital',
    waitlist_status: 'Matched',
  });

  // ---------- Vehicle ----------
  await Vehicle.create({
    code: 'AMB-114',
    registration_number: 'TN-09-AB-4521',
    status: 'Idle',
    driver_id: ambulanceDriver._id,
  });

  // ---------- Patients (waitlist) ----------
  const patientRecords = [
    { code: 'P-10432', userId: patientUser._id, name: 'Arjun Menon', organ: 'Kidney', blood: 'O+', urgency: 92.4, status: 'Matched' },
    { code: 'P-10388', userId: doctor._id, name: 'Priya Nair', organ: 'Liver', blood: 'B+', urgency: 78.1, status: 'Waiting' },
    { code: 'P-10391', userId: doctor._id, name: 'Rohan Das', organ: 'Heart', blood: 'A-', urgency: 74.6, status: 'Waiting' },
    { code: 'P-10402', userId: doctor._id, name: 'Meera Iyer', organ: 'Kidney', blood: 'AB+', urgency: 61.2, status: 'Waiting' },
    { code: 'P-10375', userId: doctor._id, name: 'Sanjay Kapoor', organ: 'Lung', blood: 'O-', urgency: 58.9, status: 'Waiting' },
  ];

  for (const p of patientRecords) {
    await Patient.create({
      code: p.code,
      name: p.name,
      organ_needed: p.organ,
      blood_type: p.blood,
      urgency_score: p.urgency,
      registered_hospital_id: cityGeneral._id,
      registered_by: p.userId,
      waitlist_status: p.status,
      hla_markers: randomHlaMarkers(),
    });
  }

  console.log('[Seed] Database seeded successfully.');
  console.log('[Seed] 3 jurisdictions: Sector 12 -> Sector 7 -> MG Road Junction');
  console.log('[Seed] Demo login: any *@organmatch.dev account, password: password123');
  console.log('[Seed] Police accounts: police@ (Sector 12), police2@ (Sector 7), police3@ (MG Road)');
}

// Support standalone CLI invocation: node src/db/seed.js
const isMain = process.argv[1]?.endsWith('seed.js');
if (isMain) {
  (async () => {
    await connectDB();
    await runSeed();
    await disconnectDB();
  })().catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
}
