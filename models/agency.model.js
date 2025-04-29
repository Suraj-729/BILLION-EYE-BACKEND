// const { uri } = require("../config.js");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const { getLocalIpAddress } = require("../utlils/network");
const uri = process.env.DB_CONNECT;
const client = new MongoClient(uri);

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

const AgencyModel = {
  // async createAgency(agencyName, lat, lng, forType, phoneNumber, password) {
  //   const agencyCollection = await getAgencyCollection();
  //   const criticalCollection = await getCriticalCollection();
  //   const nonCriticalCollection = await getNonCriticalCollection();

  //   // ✅ Validate phone number (Basic check)
  //   const phoneRegex = /^\d{10}$/;
  //   if (!phoneRegex.test(phoneNumber)) {
  //     throw new Error("Invalid phone number. Must be 10 digits.");
  //   }

  //   // ✅ Hash password before storing
  //   const hashedPassword = await bcrypt.hash(password, 10);

  //   // ✅ Validate 'forType' to allow only 'Critical' or 'Non-Critical'
  //   if (!["Critical", "Non-Critical"].includes(forType)) {
  //     throw new Error(
  //       "Invalid 'forType'. Must be 'Critical' or 'Non-Critical'."
  //     );
  //   }

  //   // ✅ Custom Agency ID logic
  //   const agencyId = `OD-${Math.floor(10 + Math.random() * 90)}-${Math.floor(
  //     10 + Math.random() * 90
  //   )}`;

  //   // ✅ Create the agency object
  //   const agency = {
  //     AgencyId: agencyId,
  //     AgencyName: agencyName,
  //     Location: { lat, lng },
  //     PhoneNumber: phoneNumber,
  //     Password: hashedPassword,
  //     For: forType,
  //     createdAt: new Date(),
  //   };

  //   try {
  //     // ✅ Insert into the main "agencies" collection
  //     await agencyCollection.insertOne(agency);
  //     console.log("[createAgency] New agency inserted:", {
  //       agencyId,
  //       agencyName,
  //     });

  //     // ✅ If Critical, store in "critical_agencies"
  //     if (forType === "Critical") {
  //       await criticalCollection.insertOne({
  //         AgencyId: agencyId,
  //         Location: { lat, lng },
  //       });
  //       console.log("[createAgency] Added to critical_agencies:", agencyId);
  //     }
  //     // ✅ If Non-Critical, store in "non_critical_agencies"
  //     else if (forType === "Non-Critical") {
  //       await nonCriticalCollection.insertOne({
  //         AgencyId: agencyId,
  //         Location: { lat, lng },
  //       });
  //       console.log("[createAgency] Added to non_critical_agencies:", agencyId);
  //     }

  //     return agencyId;
  //   } catch (error) {
  //     console.error("[createAgency] MongoDB Insert Error:", error);
  //     throw new Error("Database Insert Failed");
  //   }
  // }
  async createAgency(agencyName, forType, mobileNumber,otp, password) {
    const agencyCollection = await getAgencyCollection();
    const criticalCollection = await getCriticalCollection();
    const nonCriticalCollection = await getNonCriticalCollection();

    // ✅ Validate phone number
    if (!/^\d{10}$/.test(mobileNumber)) {
        throw new Error("Invalid phone number. Must be 10 digits.");
    }

    // ✅ Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Validate 'forType'
    if (!["Critical", "Non-Critical"].includes(forType)) {
        throw new Error("Invalid 'forType'. Must be 'Critical' or 'Non-Critical'.");
    }

    // ✅ Generate Custom Agency ID
    const agencyId = `OD-${Math.floor(10 + Math.random() * 90)}-${Math.floor(10 + Math.random() * 90)}`;

    // ✅ Create the agency object
    const agency = {
     agencyId,
        agencyName,
        mobileNumber,
        otp: otp,
        password:hashedPassword, // Ensure the password field is correctly named
        For: forType,
        createdAt: new Date(),
        
        otpExpires: new Date(Date.now()+5*60*1000), // 5 minutes
    };

    try {
        // ✅ Insert into the main "agencies" collection
        await agencyCollection.insertOne(agency);
        console.log("[createAgency] New agency inserted:", { agencyId, agencyName });

        // ✅ Store in respective collections
        if (forType === "Critical") {
            await criticalCollection.insertOne({ agencyId });
        } else {
            await nonCriticalCollection.insertOne({ agencyId });
        }

        return agencyId;
    } catch (error) {
        console.error("[createAgency] MongoDB Insert Error:", error);
        throw new Error("Database Insert Failed");
    }
},

async findOne(query) {
    const agencyCollection = await getAgencyCollection();
    console.log("[findOne] Searching for:", query);
    const result = await agencyCollection.findOne(query);
    console.log("[findOne] Found:", result);
    return result;
},
async updateOTP(mobileNumber, otp) {
    const agencyCollection = await getAgencyCollection();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    const result = await agencyCollection.updateOne(
        { mobileNumber },
        { $set: { otp, otpExpires } }
    );
    console.log("[updateOTP] Updated agency OTP:", result.modifiedCount);
    return result.modifiedCount > 0;
},

  async getAgencyDashboardCheck(agencyId) {
    try {
      if (!agencyId) throw new Error("Agency ID is required.");
      agencyId = String(agencyId); // Ensure agencyId is a string

      const db = client.db("BillionEyes_V1");

      // Fetch agency details
      const agency = await db
        .collection("agencies")
        .findOne(
          { AgencyId: agencyId },
          { projection: { AgencyName: 1, AgencyId: 1, _id: 0 } }
        );

      if (!agency) throw new Error("Agency not found.");
      console.log("[DEBUG] Found agency:", agency);

      // Fetch events assigned to this agency
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

      // const formattedEvents = await Promise.all(
      //   assignedEvents.map(async (event) => {
      //     const firstIncident = event.incidents?.[0] || null;

      //     // Determine the original image URL
      //     let originalImageUrl =
      //       firstIncident?.image_url || event.image_url || null;
      //     let proxyImageUrl = originalImageUrl;

      //     // Convert original image URL to proxy path if possible
      //     if (originalImageUrl) {
      //       try {
      //         const urlParts = new URL(originalImageUrl);
      //         const pathSegments = urlParts.pathname.split("/").filter(Boolean);

      //         if (pathSegments.length >= 3) {
      //           const bucket = pathSegments[0];
      //           const year = pathSegments[1];
      //           const filename = pathSegments.slice(2).join("/");
      //           proxyImageUrl = `/backend/${bucket}/${year}/${filename}`;
      //         }
      //       } catch (err) {
      //         console.warn(
      //           "[WARN] Invalid originalImageUrl format:",
      //           originalImageUrl
      //         );
      //       }
      //     }

      //     // Use bounding boxes from incident or fallback to event
      //     let boundingBoxes =
      //       firstIncident?.bounding_boxes || event.bounding_boxes || [];
      //     if (!Array.isArray(boundingBoxes)) {
      //       boundingBoxes = []; // Ensure boundingBoxes is an array
      //     }

      //     const [x1, y1, x2, y2] = boundingBoxes[0] || []; // Assign bounding box coordinates

      //     return {
      //       event_id: event.event_id,
      //       description: event.description,
      //       status: event.status,
      //       assignment_time:
      //         firstIncident?.timestamp?.$date || event.assignment_time || null,
      //       latitude:
      //         firstIncident?.location?.coordinates?.[1] ||
      //         event.location?.coordinates?.[1] ||
      //         null,
      //       longitude:
      //         firstIncident?.location?.coordinates?.[0] ||
      //         event.location?.coordinates?.[0] ||
      //         null,
      //       image_url: proxyImageUrl,
      //       ground_staff: event.ground_staff || [],
      //       incidentID: event.incidentID || null,
      //       userId: event.userId || null,
      //       exif: event.exif || null,
      //       timestamp:
      //         event.timestamp instanceof Date
      //           ? event.timestamp.toISOString()
      //           : event.timestamp,
      //       assigned_agency:
      //         event.assigned_agency || event.assigned_agencies || null,
      //       boundingBoxes,
      //       x1,
      //       y1,
      //       x2,
      //       y2, // Final structured bounding boxes array
      //     };
      //   })
      // );
      const formattedEvents = await Promise.all(
        assignedEvents.map(async (event) => {
          const firstIncident = event.incidents?.[0] || null;
      
          // Determine the original image URL
          let originalImageUrl =
            firstIncident?.image_url || event.image_url || null;
          let proxyImageUrl = originalImageUrl;
      
          // Convert original image URL to proxy path if possible
          if (originalImageUrl) {
            try {
              const urlParts = new URL(originalImageUrl);
              const pathSegments = urlParts.pathname.split("/").filter(Boolean);
      
              if (pathSegments.length >= 3) {
                const bucket = pathSegments[0];
                const year = pathSegments[1];
                const filename = pathSegments.slice(2).join("/");
                proxyImageUrl = `/backend/${bucket}/${year}/${filename}`;
              }
            } catch (err) {
              console.warn(
                "[WARN] Invalid originalImageUrl format:",
                originalImageUrl
              );
            }
          }
      
          // Use bounding boxes from the first incident or fallback to event
          let boundingBoxes =
            firstIncident?.bounding_boxes || event.bounding_boxes || [];
          if (!Array.isArray(boundingBoxes)) {
            boundingBoxes = []; // Ensure boundingBoxes is an array
          }
      
          const [x1, y1, x2, y2] = boundingBoxes[0] || []; // Assign bounding box coordinates
      
          // Extract all incidents' image URLs and bounding boxes
          const allIncidents = (event.incidents || []).map((incident) => {
            const incidentBoundingBoxes = incident.bounding_boxes || [];
            const [ix1, iy1, ix2, iy2] = incidentBoundingBoxes[0] || [];
            let incidentProxyImageUrl = incident.image_url || null;
      
            // Convert each incident's image URL to proxy path if possible
            if (incidentProxyImageUrl) {
              try {
                const urlParts = new URL(incidentProxyImageUrl);
                const pathSegments = urlParts.pathname.split("/").filter(Boolean);
      
                if (pathSegments.length >= 3) {
                  const bucket = pathSegments[0];
                  const year = pathSegments[1];
                  const filename = pathSegments.slice(2).join("/");
                  incidentProxyImageUrl = `/backend/${bucket}/${year}/${filename}`;
                }
              } catch (err) {
                console.warn(
                  "[WARN] Invalid incident image_url format:",
                  incidentProxyImageUrl
                );
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
          });
      
          return {
            event_id: event.event_id,
            description: event.description,
            status: event.status,
            assignment_time:
              firstIncident?.timestamp?.$date || event.assignment_time || null,
            latitude:
              firstIncident?.location?.coordinates?.[1] ||
              event.location?.coordinates?.[1] ||
              null,
            longitude:
              firstIncident?.location?.coordinates?.[0] ||
              event.location?.coordinates?.[0] ||
              null,
            image_url: proxyImageUrl,
            ground_staff: event.ground_staff || [],
            incidentID: event.incidentID || null,
            userId: event.userId || null,
            exif: event.exif || null,
            timestamp:
              event.timestamp instanceof Date
                ? event.timestamp.toISOString()
                : event.timestamp,
            assigned_agency:
              event.assigned_agency || event.assigned_agencies || null,
            boundingBoxes,
            x1,
            y1,
            x2,
            y2, // Final structured bounding boxes array
            allIncidents, // Include all incidents with proxy image_url and bounding boxes
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
      // Use `this.getEventsCollection()` to access the method
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

  // async getEventById(event_id) {
  //   try {
  //     const eventCollection = await this.getEventsCollection();
  //     return await eventCollection.findOne(
  //       { event_id: event_id },
  //       { projection: { status: 1, _id: 0 } }
  //     );
  //   } catch (error) {
  //     console.error("[getEventById] Database Error:", error);
  //     throw new Error("Database Error");
  //   }
  // }
  // ,

  async getEventsCollection() {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }
    const db = client.db("BillionEyes_V1");
    return db.collection("events");
  },

  // async getEventById(event_id, fields = [], includeImageUrl = true) {
  //   try {
  //     const eventCollection = await this.getEventsCollection();

  //     // Base projection
  //     let projection = {
  //       event_id: 1,
  //       assignment_time: 1,
  //       description: 1,
  //       ground_staff: 1,
  //       location: 1,
  //       bounding_boxes: 1,
  //       ...fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {}),
  //     };

  //     if (includeImageUrl) {
  //       projection.image_url = {
  //         $concat: [
  //           "http://minio:9000/billion-eye-images/",
  //           { $substr: [{ $toString: "$assignment_time" }, 0, 10] },
  //           "/I-",
  //           { $substr: [{ $toString: "$assignment_time" }, 11, 8] },
  //           ".jpg",
  //         ],
  //       };
  //     }

  //     const eventData = await eventCollection
  //       .aggregate([
  //         { $match: { event_id } },
  //         {
  //           $addFields: {
  //             firstIncident: { $arrayElemAt: ["$incidents", 0] },
  //           },
  //         },
  //         {
  //           $project: {
  //             ...projection,
  //             latitude: {
  //               $arrayElemAt: ["$firstIncident.location.coordinates", 1],
  //             },
  //             longitude: {
  //               $arrayElemAt: ["$firstIncident.location.coordinates", 0],
  //             },
  //             incidents: {
  //               $map: {
  //                 input: "$incidents",
  //                 as: "incident",
  //                 in: {
  //                   latitude: {
  //                     $arrayElemAt: ["$$incident.location.coordinates", 1],
  //                   },
  //                   longitude: {
  //                     $arrayElemAt: ["$$incident.location.coordinates", 0],
  //                   },
  //                   timestamp: "$$incident.timestamp",
                    
  //                   boundingBoxes: "$$incident.boundingBox",
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       ])
  //       .toArray();

  //     if (eventData.length === 0) return null;

  //     const event = eventData[0];

  //     // Convert image URL to proxied format
  //     const firstIncident = event.incidents?.[0] || null;
  //     let originalImageUrl =
  //       firstIncident?.image_url || event.image_url || null;

  //     if (originalImageUrl) {
  //       try {
  //         const urlParts = new URL(originalImageUrl);
  //         const pathSegments = urlParts.pathname.split("/").filter(Boolean);

  //         if (pathSegments.length >= 3) {
  //           const [bucket, year, ...rest] = pathSegments;
  //           const filename = rest.join("/");
  //           event.image_url = `/backend/${bucket}/${year}/${filename}`;
  //         }
  //       } catch (err) {
  //         console.warn(
  //           "[WARN] Invalid originalImageUrl format:",
  //           originalImageUrl
  //         );
  //         event.image_url = originalImageUrl;
  //       }
  //     } else {
  //       event.image_url = null;
  //     }

  //     // Bounding box extraction
  //     const boundingBoxArray =
  //       firstIncident?.bounding_boxes ||
  //       firstIncident?.bounding_boxes ||
  //       event.bounding_boxes ||
  //       [];

  //     if (Array.isArray(boundingBoxArray) && boundingBoxArray.length >= 4) {
  //       [event.x1, event.y1, event.x2, event.y2] = boundingBoxArray;
  //     } else {
  //       event.x1 = event.y1 = event.x2 = event.y2 = null;
  //     }

  //     return event;
  //   } catch (error) {
  //     console.error("[getEventById] Database Error:", error);
  //     throw new Error("Database Error");
  //   }
  // },
  async getEventById(event_id, fields = [], includeImageUrl = true, currentAgencyId = null) {
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
          const url = new URL(imageUrl);
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts.length >= 3) {
            const [bucket, date, ...rest] = parts;
            const filename = rest.join("/");
            event.image_url = `/backend/${bucket}/${date}/${filename}`;
          }
        } catch {
          event.image_url = imageUrl;
        }
      } else {
        event.image_url = null;
      }
  
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
      console.error("[getEventById] Database Error:", err);
      throw new Error("Database Error");
    }
  }
  
  
};

module.exports = AgencyModel;

// const db = client.db("BillionEyes_V1");
