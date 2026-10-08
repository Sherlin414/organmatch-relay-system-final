import { AuditLog, Match, Patient, Hospital } from '../models/index.js';
import { verifyChainIntegrity } from '../services/auditLogService.js';

export async function listAuditLog(req, res) {
  const entries = await AuditLog.find()
    .sort({ timestamp: -1 })
    .limit(50)
    .populate({ path: 'related_match_id', select: 'code' })
    .lean();

  // Map populated field to include match_code for frontend compatibility
  const mapped = entries.map((entry) => ({
    ...entry,
    match_code: entry.related_match_id?.code ?? null,
  }));

  const chainValid = await verifyChainIntegrity();
  res.json({ entries: mapped, chainValid });
}

export async function networkStats(req, res) {
  const [activeMatches, patientsWaiting, hospitalCount] = await Promise.all([
    Match.countDocuments({ status: { $in: ['Proposed', 'Confirmed'] } }),
    Patient.countDocuments({ waitlist_status: 'Waiting' }),
    Hospital.countDocuments({}),
  ]);

  // Average minutes from created_at to confirmed_at for confirmed matches
  const avgResult = await Match.aggregate([
    { $match: { confirmed_at: { $ne: null } } },
    {
      $project: {
        diffMinutes: {
          $divide: [
            { $subtract: ['$confirmed_at', '$created_at'] },
            60000, // ms → minutes
          ],
        },
      },
    },
    { $group: { _id: null, avg: { $avg: '$diffMinutes' } } },
  ]);

  const avgMinutes =
    avgResult.length > 0 ? Number(avgResult[0].avg).toFixed(1) : '0.0';

  res.json({
    stats: [
      { label: 'Active Matches', value: String(activeMatches) },
      { label: 'Patients Waiting', value: String(patientsWaiting) },
      { label: 'Hospitals Connected', value: String(hospitalCount) },
      { label: 'Avg. Match Time', value: `${avgMinutes} min` },
    ],
  });
}
