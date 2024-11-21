import { prisma } from "../index.js";
import { errorHandler } from "../utils/middlewares.js";
import { redisClient } from "../services/redisClient.js";

export const createVenue = async (req, res, next) => {
  const { name, address, city, timezone, capacity } = req.body;

  if (!name || !address || !city || !timezone || !capacity) {
    return next(errorHandler(400, "All fields are required"));
  }

  try {
    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        timezone,
        capacity,
      },
    });
    res.status(201).json({
      message: "Venue created successfully",
      venue,
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    next(errorHandler(500, "Error creating venue"));
  }
};

export const getAllVenues = async (req, res, next) => {
  try {
    const cacheKey = "all_venues";

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit for venues");
      return res.status(200).json(JSON.parse(cachedData)); 
    }

    console.log("Cache miss for venues, fetching from DB");

    const venues = await prisma.venue.findMany({
      include: { events: true },
    });

    await redisClient.set(cacheKey, JSON.stringify(venues), {
      EX: 3600,
    });

    res.status(200).json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    next(errorHandler(500, "Error fetching venues"));
  }
};

export const getVenueDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: { events: true },
    });

    if (!venue) {
      return next(errorHandler(404, "Venue not found"));
    }

    res.status(200).json(venue);
  } catch (error) {
    console.error("Error fetching venue details:", error);
    next(errorHandler(500, "Error fetching venue details"));
  }
};


export const updateVenue = async (req, res, next) => {
  const { id } = req.params;
  const { name, address, city, timezone, capacity } = req.body;

  if (!name || !address || !city || !timezone || !capacity) {
    return next(errorHandler(400, "All fields are required"));
  }

  try {
    const venue = await prisma.venue.update({
      where: { id },
      data: {
        name,
        address,
        city,
        timezone,
        capacity,
      },
    });

    res.status(200).json({
      message: "Venue updated successfully",
      venue,
    });
  } catch (error) {
    console.error("Error updating venue:", error);

    if (error.code === "P2025") {
      return next(errorHandler(404, "Venue not found"));
    }

    next(errorHandler(500, "Error updating venue"));
  }
};


export const deleteVenue = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Check if the venue has associated events
    const events = await prisma.event.findMany({
      where: { venueId: id },
    });

    if (events.length > 0) {
      return next(
        errorHandler(400, "Cannot delete venue, events are associated")
      );
    }

    await prisma.venue.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Venue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting venue:", error);

    if (error.code === "P2025") {
      return next(errorHandler(404, "Venue not found"));
    }

    next(errorHandler(500, "Error deleting venue"));
  }
};
