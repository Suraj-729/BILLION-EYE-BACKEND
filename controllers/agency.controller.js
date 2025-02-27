const AgencyModel = require("../models/agency.model");
const ImageModel = require("../models/camera.model"); 
const bcrypt = require("bcrypt");

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


module.exports = {
    createAgency,
    // getImages,
    getLatestImage
};



// Fetch images for agencies
// async function getImages(req, res) {
//     try {
//         const images = await ImageModel.getAllImages(); // Fetch images from DB
//         res.status(200).json(images);
//     } catch (error) {
//         console.error("[getImages] Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

// // Get an agency by ID
// async function getAgencyById(req, res) {
//     try {
//         const { agencyId } = req.params;
//         const agency = await AgencyModel.getAgencyById(agencyId);

//         if (!agency) {
//             return res.status(404).json({ success: false, message: "Agency not found" });
//         }

//         res.json({ success: true, agency });
//     } catch (error) {
//         console.error("[getAgencyById] Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

// // Get all agencies
// async function getAllAgencies(req, res) {
//     try {
//         const agencies = await AgencyModel.getAllAgencies();
//         res.json({ success: true, agencies });
//     } catch (error) {
//         console.error("[getAllAgencies] Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

// // Update an agency
// async function updateAgency(req, res) {
//     try {
//         const { agencyId } = req.params;
//         const updateData = req.body;

//         const result = await AgencyModel.updateAgency(agencyId, updateData);

//         if (result.modifiedCount === 0) {
//             return res.status(404).json({ success: false, message: "Agency not found or no changes applied" });
//         }

//         res.json({ success: true, message: "Agency updated successfully" });
//     } catch (error) {
//         console.error("[updateAgency] Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// }

// // Delete an agency
// async function deleteAgency(req, res) {
//     try {
//         const { agencyId } = req.params;
//         const result = await AgencyModel.deleteAgency(agencyId);

//         if (result.deletedCount === 0) {
//             return res.status(404).json({ success: false, message: "Agency not found" });
//         }

//         res.json({ success: true, message: "Agency deleted successfully" });
//     } catch (error) {
//         console.error("[deleteAgency] Error:", error.message);
//         res.status(500).json({ success: false, message: error.message });
//     }
// }