const express = require("express");
const router = express.Router();
const {getImagesByStatus} = require("../models/camera.model");
// const ImageController = require('../controllers/images.controller')
const AgencyController = require('../controllers/agency.controller');

router.post('/agencyId', AgencyController.createAgency);
// ✅ Fetch Recent Images

// router.get('/user/images', ImageController.getImageData);
router.get("/user/images/latest", AgencyController.getLatestImage);

router.get("/images/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["ACTIVE", "ASSIGNED", "RESOLVED"];
    
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const images = await getImagesByStatus(status.toUpperCase());
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: "Error fetching images by status" });
  }
});
// router.get("/images/status/:incidentID", AgencyController.getUpdateStatus);
router.put("/images/status/:incidentID", AgencyController.updateStatus);
router.get("/images/status", AgencyController.getUpdateStatus);


module.exports = router;