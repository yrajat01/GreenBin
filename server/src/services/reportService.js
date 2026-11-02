const Report = require('../models/Report');
const Bin = require('../models/Bin');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Service managing citizen issue reports and gamification rewards
 */
class ReportService {
  /**
   * Submit an issue report from a citizen
   */
  static async submitReport({ binId, issueType, photoUrl, description, user, io }) {
    if (!binId || !issueType) {
      throw ApiError.badRequest('Bin ID and Issue Type are required.');
    }

    // 1. Verify bin exists
    const bin = await Bin.findOne({ binId });
    if (!bin) {
      throw ApiError.notFound(`Bin code ${binId} does not exist.`);
    }

    // 2. Rate limit check: Max 5 reports per hour per citizen
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyReportCount = await Report.countDocuments({
      userId: user.uid,
      createdAt: { $gte: oneHourAgo },
    });

    if (hourlyReportCount >= 5) {
      throw ApiError.tooManyRequests('Rate limit exceeded. Maximum 5 reports per hour.');
    }

    // 3. Create report document
    const reportId = `TK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReport = await Report.create({
      reportId,
      binId,
      userId: user.uid,
      issueType,
      photoUrl: photoUrl || '',
      description: description || '',
      status: 'pending',
    });

    // 4. Update Bin status to smell_reported
    bin.status = 'smell_reported';
    bin.lastReported = new Date();
    await bin.save();

    // 5. Award 10 eco-points to citizen + badge progression
    const citizenUser = await User.findOne({ uid: user.uid });
    if (citizenUser) {
      citizenUser.points = (citizenUser.points || 0) + 10;
      citizenUser.reportCount = (citizenUser.reportCount || 0) + 1;

      if (citizenUser.reportCount === 1 && !citizenUser.badgesEarned.includes('First Report')) {
        citizenUser.badgesEarned.push('First Report');
      }
      if (citizenUser.reportCount === 5 && !citizenUser.badgesEarned.includes('Eco Regular')) {
        citizenUser.badgesEarned.push('Eco Regular');
      }
      if (citizenUser.reportCount === 10 && !citizenUser.badgesEarned.includes('Eco Champion')) {
        citizenUser.badgesEarned.push('Eco Champion');
      }

      await citizenUser.save();
    }

    // 6. Broadcast real-time updates
    if (io) {
      io.emit('bin_update', bin);
      io.emit('new_report', {
        report: newReport,
        userName: citizenUser ? citizenUser.name : 'Citizen',
      });
      io.emit('user_update', { uid: user.uid, points: citizenUser ? citizenUser.points : 0 });
    }

    return {
      message: 'Report submitted successfully!',
      report: newReport,
      pointsEarned: 10,
      badges: citizenUser ? citizenUser.badgesEarned : [],
    };
  }

  /**
   * Get all reports filed by a specific user
   */
  static async getUserReports(userId) {
    return Report.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get all reports across the system (admin view)
   */
  static async getAllReports() {
    return Report.find().sort({ createdAt: -1 });
  }

  /**
   * Update report status and resolution notes (admin only)
   */
  static async updateReport(reportId, { status, notes }, io) {
    const report = await Report.findOne({ reportId });
    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    if (status) report.status = status;
    if (notes) report.notes = notes;
    if (status === 'resolved') {
      report.resolvedAt = new Date();
    }

    await report.save();

    // If resolved, verify if bin can revert to normal status
    const pendingCount = await Report.countDocuments({ binId: report.binId, status: 'pending' });
    if (pendingCount === 0) {
      const bin = await Bin.findOne({ binId: report.binId });
      if (bin && bin.status === 'smell_reported') {
        bin.status = 'normal';
        await bin.save();

        if (io) {
          io.emit('bin_update', bin);
        }
      }
    }

    return {
      message: 'Report updated successfully',
      report,
    };
  }
}

module.exports = ReportService;

