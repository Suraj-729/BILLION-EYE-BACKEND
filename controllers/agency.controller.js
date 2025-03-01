const AgencyModel = require("../models/agency.model");
const { getImageCollection } = require("../models/camera.model"); 
const ImageModel = require("../models/camera.model")
const bcrypt = require("bcryptjs");
const { ObjectId } = require('mongodb');
// Create A New Agency
async function createAgency(req, res) {
    try {
        const { agencyName, lat, lng, forType, phoneNumber, password } = req.body;
        console.log("[createAgency] Received body:", req.body);

        // Validate required fields
        if (!agencyName || lat == null || lng == null || !forType || !phoneNumber || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Validate phone number (must be 10 digits)
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ success: false, message: "Invalid phone number. Must be 10 digits." });
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        
        // Create agency entry
        const agencyId = await AgencyModel.createAgency(agencyName, lat, lng, forType, phoneNumber, hashedPassword);
        res.status(201).json({ success: true, agencyId });
        console.log(agencyId);
        
    } catch (error) {
        console.error("[createAgency] Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}



async function getLatestImage(req, res) {
    try {
        const latestImage = await ImageModel.getLatestImage();
        if (!latestImage) {
            return res.status(404).json({ success: false, message: "No image found" });
        }
        res.status(200).json(latestImage);
    } catch (error) {
        console.error("[getLatestImage] Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
}

async function getUpdateStatus(req, res) {
    try {
        console.log("[getUpdateStatus] API hit with params:", req.params);

        let { incidentID } = req.params;
        incidentID = incidentID.replace(/^:/, ""); // Remove ":" if mistakenly passed

        if (!incidentID) {
            console.warn("[getUpdateStatus] Missing incident ID");
            return res.status(400).json({ success: false, message: "Incident ID is required" });
        }

        const collection = await getImageCollection();
        console.log(`[getUpdateStatus] Fetching incident with ID: ${incidentID}`);

        const incident = await collection.findOne({ incidentID: incidentID }); // Keep it as a string

        if (!incident) {
            console.warn(`[getUpdateStatus] Incident not found: ${incidentID}`);
            return res.status(404).json({ success: false, message: "Incident not found" });
        }

        console.log(`[getUpdateStatus] Incident found:`, incident);

        res.status(200).json({
            success: true,
            status: incident.status || "Unknown",
            accepted: incident.accepted ?? false, // Ensures 'accepted' is always a boolean
        });

    } catch (error) {
        console.error("[getUpdateStatus] Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
async function updateStatus(req, res) {
    try {
        console.log("[updateStatus] API hit with params:", req.params);

        let { incidentID } = req.params;
        incidentID = incidentID.replace(/^:/, ""); // Remove ":" if mistakenly passed

        if (!incidentID) {
            console.warn("[updateStatus] Missing incident ID");
            return res.status(400).json({ success: false, message: "Incident ID is required" });
        }

        const collection = await getImageCollection();
        console.log(`[updateStatus] Updating incident with ID: ${incidentID}`);

        // Update the status in the database
        const updateResult = await collection.updateOne(
            { incidentID: incidentID }, 
            { $set: { status: "ACTIVE", accepted: true } }
        );

        if (updateResult.matchedCount === 0) {
            console.warn(`[updateStatus] Incident not found: ${incidentID}`);
            return res.status(404).json({ success: false, message: "Incident not found" });
        }

        console.log(`[updateStatus] Incident updated successfully`);
        res.status(200).json({ success: true, message: "Incident status updated to ACTIVE" });

    } catch (error) {
        console.error("[updateStatus] Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}


module.exports = {
    createAgency,
    getUpdateStatus,
    getLatestImage,
    updateStatus
};

