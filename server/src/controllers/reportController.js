const ReportService = require('../services/reportService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller for Report endpoints
 */
class ReportController {
  static async submitReport(req, res) {
    const { binId, issueType, photoUrl, description } = req.body;
    const io = req.app.get('io');
    const result = await ReportService.submitReport({
      binId,
      issueType,
      photoUrl,
      description,
      user: req.user,
      io,
    });
    return ApiResponse.created(res, result);
  }

  static async getMyReports(req, res) {
    const reports = await ReportService.getUserReports(req.user.uid);
    return ApiResponse.send(res, reports);
  }

  static async getAllReports(req, res) {
    const reports = await ReportService.getAllReports();
    return ApiResponse.send(res, reports);
  }

  static async updateReport(req, res) {
    const { status, notes } = req.body;
    const io = req.app.get('io');
    const result = await ReportService.updateReport(req.params.id, { status, notes }, io);
    return ApiResponse.send(res, result);
  }
}

module.exports = ReportController;

