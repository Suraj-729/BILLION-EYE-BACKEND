const { uri } = require("../config.js");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const { getLocalIpAddress } = require("../utlils/network");
const AWS = require("aws-sdk");

// MongoDB client setup
const client = new MongoClient(uri);



// AWS S3 setup
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  region: process.env.AWS_REGION, // Add this line
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

// Helper functions to get MongoDB collections
async function getAgencyCollection() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  const db = client.db("BillionEyes_V1");
  return db.collection("agencies");
}

async function getCriticalCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("critical_agencies");
}

async function getNonCriticalCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("non_critical_agencies");
}

async function getGroundStaffCollection() {
  const db = client.db("BillionEyes_V1");
  return db.collection("ground_staff");
}

// Agency Model
const AgencyModel = {
  async createAgency(agencyName, mobileNumber, password, location = {}) {
    const agencyCollection = await getAgencyCollection();
  
    // Validate phone number
    if (!/^\d{10}$/.test(mobileNumber)) {
      throw new Error("Invalid phone number. Must be 10 digits.");
    }
  
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Validate 'forType' (if applicable)
    const forType = "Non-Critical"; // Default value, can be updated based on requirements
    if (!["Critical", "Non-Critical"].includes(forType)) {
      throw new Error("Invalid 'forType'. Must be 'Critical' or 'Non-Critical'.");
    }
  
    // Generate Custom Agency ID
    const agencyId = `OD-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;
  
    // Validate location (if provided)
    if (location.latitude && location.longitude) {
      if (typeof location.latitude !== "number" || typeof location.longitude !== "number") {
        throw new Error("Invalid location. Latitude and Longitude must be numbers.");
      }
    }
  
    // Create the agency object
    const agency = {
      agencyId,
      agencyName,
      mobileNumber,
      password: hashedPassword,
      location: {
        latitude: location.latitude || null,
        longitude: location.longitude || null,
      },
      For: forType,
      createdAt: new Date(),
    };
  
    try {
      // Insert into the main "agencies" collection
      await agencyCollection.insertOne(agency);
      console.log("[createAgency] New agency inserted:", { agencyId, agencyName });
  
      // Store in respective collections
      if (forType === "Critical") {
        const criticalCollection = await getCriticalCollection();
        await criticalCollection.insertOne({ agencyId });
      } else {
        const nonCriticalCollection = await getNonCriticalCollection();
        await nonCriticalCollection.insertOne({ agencyId });
      }
  
      return agencyId;
    } catch (error) {
      console.error("[createAgency] MongoDB Insert Error:", error);
      throw new Error("Database Insert Failed");
    }
  },

  















  async getAgencyDashboardCheck(agencyId) {
    try {
      if (!agencyId) throw new Error("Agency ID is required.");
      agencyId = String(agencyId);

      const db = client.db("BillionEyes_V1");

      const agency = await db
        .collection("agencies")
        .findOne(
          { AgencyId: agencyId },
          { projection: { AgencyName: 1, AgencyId: 1, _id: 0 } }
        );

      if (!agency) throw new Error("Agency not found.");
      console.log("[DEBUG] Found agency:", agency);

      const assignedEvents = await db
        .collection("events")
        .find({
          $or: [
            { "assigned_agency.agencies": agency.AgencyId },
            { "assigned_agencies.agencies": agency.AgencyId },
          ],
        })
        .project({
          _id: 0,
          event_id: 1,
          description: 1,
          assigned_agency: 1,
          assigned_agencies: 1,
          assignment_time: 1,
          ground_staff: 1,
          incidentID: 1,
          userId: 1,
          location: 1,
          timestamp: 1,
          image_url: 1,
          exif: 1,
          status: 1,
          incidents: 1,
          bounding_boxes: 1,
        })
        .toArray();

      const formattedEvents = await Promise.all(
        assignedEvents.map(async (event) => {
          const firstIncident = event.incidents?.[0] || null;

          let originalImageUrl = firstIncident?.image_url || event.image_url || null;
          let proxyImageUrl = originalImageUrl;

          if (originalImageUrl) {
            try {
              const urlParts = new URL(originalImageUrl);
              const pathSegments = urlParts.pathname.split("/").filter(Boolean);
            
              if (pathSegments.length >= 3) {
                const year = pathSegments[1];
                const filename = pathSegments.slice(2).join("/");
                const params = {
                  Bucket: "billion-eyes-images",
                  Key: `${year}/${filename}`,
                };
            
                try {
                  const data = await s3.getObject(params).promise();
                  if (data && data.Body) {
                    proxyImageUrl = `data:image/jpeg;base64,${data.Body.toString("base64")}`;
                  }
                } catch (err) {
                  if (err.code === "NoSuchBucket") {
                    console.error(`[ERROR] S3 Bucket does not exist: ${params.Bucket}`);
                  } else {
                    console.error(`[ERROR] S3 getObject failed: ${err.message}`);
                  }
                }
              }
            } catch (err) {
              console.warn(`[WARN] Invalid originalImageUrl format: ${originalImageUrl}`, err.message);
            }
          }

          let boundingBoxes = firstIncident?.bounding_boxes || event.bounding_boxes || [];
          if (!Array.isArray(boundingBoxes)) boundingBoxes = [];
          const [x1, y1, x2, y2] = boundingBoxes[0] || [];

          const allIncidents = await Promise.all(
            (event.incidents || []).map(async (incident) => {
              const incidentBoundingBoxes = incident.bounding_boxes || [];
              const [ix1, iy1, ix2, iy2] = incidentBoundingBoxes[0] || [];
              let incidentProxyImageUrl = incident.image_url || null;

              if (incidentProxyImageUrl && incidentProxyImageUrl.startsWith("http")) {
                try {
                  const urlParts = new URL(incidentProxyImageUrl);
                  const pathSegments = urlParts.pathname.split("/").filter(Boolean);

                  if (pathSegments.length >= 3) {
                    const year = pathSegments[1];
                    const filename = pathSegments.slice(2).join("/");

                    const params = {
                      Bucket: "billion-eyes-images",
                      Key: `${year}/${filename}`,
                    };

                    const data = await s3.getObject(params).promise();
                    if (data && data.Body) {
                      incidentProxyImageUrl = `data:image/jpeg;base64,${data.Body.toString("base64")}`;
                    }
                  }
                } catch (error) {
                  console.warn("Image fetch failed:", error.message);
                }
              }

              return {
                image_url: incidentProxyImageUrl,
                boundingBoxes: incidentBoundingBoxes,
                x1: ix1,
                y1: iy1,
                x2: ix2,
                y2: iy2,
              };
            })
          );

          return {
            event_id: event.event_id,
            description: event.description,
            status: event.status,
            assignment_time: firstIncident?.timestamp?.$date || event.assignment_time || null,
            latitude: firstIncident?.location?.coordinates?.[1] || event.location?.coordinates?.[1] || null,
            longitude: firstIncident?.location?.coordinates?.[0] || event.location?.coordinates?.[0] || null,
            image_url: proxyImageUrl,
            ground_staff: event.ground_staff || [],
            incidentID: event.incidentID || null,
            userId: event.userId || null,
            exif: event.exif || null,
            timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
            assigned_agency: event.assigned_agency || event.assigned_agencies || null,
            boundingBoxes,
            x1,
            y1,
            x2,
            y2,
            allIncidents,
          };
        })
      );

      return {
        AgencyName: agency.AgencyName,
        AgencyId: agency.AgencyId,
        assignedEvents: formattedEvents,
      };
    } catch (error) {
      console.error("[ERROR] getAgencyDashboardCheck:", error.message);
      throw new Error(error.message);
    }
  },

  async updateEventStatus(event_id, newStatus) {
    try {
      const eventCollection = await this.getEventsCollection();
      const result = await eventCollection.updateOne(
        { event_id: event_id },
        { $set: { status: newStatus } }
      );
      return result;
    } catch (error) {
      console.error("[updateEventStatus] Database Error:", error);
      throw new Error("Database Error");
    }
  },

  async getEventById(event_id) {
    try {
      const eventCollection = await this.getEventsCollection();
      return await eventCollection.findOne(
        { event_id: event_id },
        { projection: { status: 1, _id: 0, incidents: 1 , description: 1 , timestamp:1 ,image_url : 1 , location : 1} }
      );
    } catch (error) {
      console.error("[getEventById] Database Error:", error);
      throw new Error("Database Error");
    }
  },



  async getEventsCollection() {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }
    const db = client.db("BillionEyes_V1");
    return db.collection("events");
  },

  async getIncidentImages(incidents = []) {
    try {
      return await Promise.all(
        incidents.map(async (incident) => {
          let base64Image = null;
          const originalUrl = incident.image_url || "";

          if (originalUrl.startsWith("http")) {
            try {
              const url = new URL(originalUrl);
              const parts = url.pathname.split("/").filter(Boolean);
              const year = parts[1];
              const filename = parts.slice(2).join("/");

              const s3Params = {
                Bucket: "billion-eyes-images",
                Key: `${year}/${filename}`,
              };

              const data = await s3.getObject(s3Params).promise();
              base64Image = `data:image/jpeg;base64,${data.Body.toString("base64")}`;
            } catch (err) {
              console.error("Image fetch error:", err.message);
            }
          }

          const boxes = Array.isArray(incident.bounding_boxes) ? incident.bounding_boxes : [];
          const [x1, y1, x2, y2] = boxes[0] || [null, null, null, null];

          return {
            latitude: incident.latitude || null,
            longitude: incident.longitude || null,
            timestamp: incident.timestamp || null,
            base64_image: base64Image,
            bounding_boxes: boxes,
            x1,
            y1,
            x2,
            y2,
          };
        })
      );
    } catch (error) {
      console.error("Unexpected error in getIncidentImages:", error.message);
      throw new Error("Error processing incident images");
    }
  },

  async getEventReportId(event_id, fields = [], includeImageUrl = true, currentAgencyId = null) {
    try {
      const eventCollection = await this.getEventsCollection();
  
      const projection = {
        event_id: 1,
        assignment_time: 1,
        description: 1,
        ground_staff: 1,
        location: 1,
        assigned_agency: 1,
        bounding_boxes: 1,
        ...fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
      };
  
      const pipeline = [
        { $match: { event_id } },
        {
          $addFields: {
            firstIncident: { $arrayElemAt: ["$incidents", 0] },
          },
        },
        {
          $project: {
            ...projection,
            latitude: { $arrayElemAt: ["$firstIncident.location.coordinates", 1] },
            longitude: { $arrayElemAt: ["$firstIncident.location.coordinates", 0] },
            incidents: {
              $map: {
                input: "$incidents",
                as: "incident",
                in: {
                  latitude: { $arrayElemAt: ["$$incident.location.coordinates", 1] },
                  longitude: { $arrayElemAt: ["$$incident.location.coordinates", 0] },
                  timestamp: "$$incident.timestamp",
                  image_url: "$$incident.image_url",
                  boundingBoxes: "$$incident.bounding_boxes",
                },
              },
            },
          },
        },
      ];
  
      const eventData = await eventCollection.aggregate(pipeline).toArray();
      if (eventData.length === 0) return null;
  
      const event = eventData[0];
  
      const firstIncident = event.incidents?.[0] || null;
      let imageUrl = firstIncident?.image_url || event.image_url;
  
      if (includeImageUrl && imageUrl) {
        try {
          const urlParts = new URL(imageUrl);
          const pathSegments = urlParts.pathname.split("/").filter(Boolean);
  
          if (pathSegments.length >= 3) {
            const year = pathSegments[1];
            const filename = pathSegments.slice(2).join("/");
  
            const params = {
              Bucket: "billion-eyes-images",
              Key: `${year}/${filename}`,
            };
  
            const data = await s3.getObject(params).promise();
            if (data && data.Body) {
              imageUrl = `data:image/jpeg;base64,${data.Body.toString("base64")}`;
            }
          }
        } catch (error) {
          console.warn("Image fetch failed:", error.message);
        }
      } else {
        imageUrl = null;
      }
  
      event.image_url = imageUrl;
  
      const boundingBoxes = firstIncident?.boundingBoxes || [];
      event.boundingBoxes = boundingBoxes;
  
      if (boundingBoxes.length > 0 && Array.isArray(boundingBoxes[0])) {
        const [x1, y1, x2, y2] = boundingBoxes[0];
        event.x1 = x1;
        event.y1 = y1;
        event.x2 = x2;
        event.y2 = y2;
      } else {
        event.x1 = event.y1 = event.x2 = event.y2 = null;
      }
  
      // ✅ Inject AgencyId
      if (currentAgencyId) {
        event.AgencyId = currentAgencyId;
      }
  
      return event;
    } catch (err) {
      console.error("[getEventReportId] Database Error:", err);
      throw new Error("Database Error");
    }
  }
,
};

module.exports = AgencyModel;


// async updateOTP(mobileNumber, otp) {
//   const agencyCollection = await getAgencyCollection();
//   const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
//   const result = await agencyCollection.updateOne(
//     { mobileNumber },
//     { $set: { otp, otpExpires } }
//   );
//   console.log("[updateOTP] Updated agency OTP:", result.modifiedCount);
//   return result.modifiedCount > 0;
// }