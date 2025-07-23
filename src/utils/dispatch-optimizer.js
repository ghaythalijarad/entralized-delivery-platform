/**
 * Dispatch Optimization Service
 * Advanced algorithms for optimal driver assignment and route optimization
 * Handles high-performance delivery dispatching for the centralized platform
 */

class DispatchOptimizer {
    constructor() {
        this.name = 'DispatchOptimizer';
        this.version = '1.0.0';
        
        // Algorithm configurations
        this.algorithms = {
            NEAREST_DRIVER: 'nearest_driver',
            OPTIMAL_SCORE: 'optimal_score',
            LOAD_BALANCED: 'load_balanced',
            ZONE_BASED: 'zone_based',
            ML_PREDICTIVE: 'ml_predictive'
        };
        
        // Performance weights for optimization
        this.weights = {
            distance: 0.35,      // 35% - Distance to pickup
            rating: 0.20,        // 20% - Driver rating
            efficiency: 0.15,    // 15% - Historical performance
            vehicleMatch: 0.10,  // 10% - Vehicle type appropriateness
            currentLoad: 0.10,   // 10% - Current delivery load
            priority: 0.10       // 10% - Order priority
        };
        
        // Zone definitions for Riyadh (can be extended for other cities)
        this.zones = {
            'central': {
                name: 'Central Riyadh',
                center: { latitude: 24.7136, longitude: 46.6753 },
                radius: 5000, // 5km
                priority: 1
            },
            'north': {
                name: 'North Riyadh',
                center: { latitude: 24.7836, longitude: 46.6753 },
                radius: 7000, // 7km
                priority: 2
            },
            'south': {
                name: 'South Riyadh',
                center: { latitude: 24.6436, longitude: 46.6753 },
                radius: 7000,
                priority: 2
            },
            'east': {
                name: 'East Riyadh',
                center: { latitude: 24.7136, longitude: 46.7753 },
                radius: 6000,
                priority: 2
            },
            'west': {
                name: 'West Riyadh',
                center: { latitude: 24.7136, longitude: 46.5753 },
                radius: 6000,
                priority: 2
            }
        };

        // Performance metrics tracking
        this.metrics = {
            totalDispatches: 0,
            successfulAssignments: 0,
            averageAssignmentTime: 0,
            zonePerformance: {},
            driverUtilization: {}
        };

        // Dispatch queue for retry mechanism
        this.dispatchQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Main dispatch function - finds optimal driver for an order
     */
    async dispatch(order, availableDrivers, algorithm = this.algorithms.OPTIMAL_SCORE) {
        const startTime = Date.now();
        
        try {
            console.log(`🚀 Starting dispatch for order ${order.orderId} using ${algorithm} algorithm`);
            
            // Validate inputs
            if (!order || !availableDrivers || availableDrivers.length === 0) {
                throw new Error('Invalid dispatch parameters');
            }

            // Filter drivers by zone if applicable
            const zoneFilteredDrivers = this.filterDriversByZone(order, availableDrivers);
            
            if (zoneFilteredDrivers.length === 0) {
                console.log(`⚠️ No drivers available in order zone, expanding search...`);
                // Fallback to all available drivers with distance penalty
                return await this.findOptimalDriver(order, availableDrivers, algorithm, true);
            }

            // Find optimal driver using selected algorithm
            const result = await this.findOptimalDriver(order, zoneFilteredDrivers, algorithm);
            
            // Track performance metrics
            const assignmentTime = Date.now() - startTime;
            this.updateMetrics(order, result, assignmentTime);
            
            console.log(`✅ Dispatch completed in ${assignmentTime}ms:`, result);
            return result;
            
        } catch (error) {
            console.error(`❌ Dispatch failed for order ${order.orderId}:`, error);
            
            // Add to retry queue
            this.addToRetryQueue(order);
            
            throw error;
        }
    }

    /**
     * Filter drivers by zone proximity
     */
    filterDriversByZone(order, drivers) {
        const orderZone = this.getOrderZone(order);
        
        if (!orderZone) {
            return drivers; // No zone filtering if zone can't be determined
        }

        return drivers.filter(driver => {
            const driverZone = driver.zone || this.getDriverZone(driver);
            
            // Prefer same zone, but allow adjacent zones
            if (driverZone === orderZone) return true;
            
            // Check if zones are adjacent (within reasonable distance)
            const orderCenter = this.zones[orderZone]?.center;
            const driverCenter = this.zones[driverZone]?.center;
            
            if (orderCenter && driverCenter) {
                const distance = this.calculateDistance(orderCenter, driverCenter);
                return distance <= 10000; // 10km max between zones
            }
            
            return false;
        });
    }

    /**
     * Find optimal driver using specified algorithm
     */
    async findOptimalDriver(order, drivers, algorithm, isExpanded = false) {
        switch (algorithm) {
            case this.algorithms.NEAREST_DRIVER:
                return this.nearestDriverAlgorithm(order, drivers);
                
            case this.algorithms.LOAD_BALANCED:
                return this.loadBalancedAlgorithm(order, drivers);
                
            case this.algorithms.ZONE_BASED:
                return this.zoneBasedAlgorithm(order, drivers);
                
            case this.algorithms.ML_PREDICTIVE:
                return this.mlPredictiveAlgorithm(order, drivers);
                
            case this.algorithms.OPTIMAL_SCORE:
            default:
                return this.optimalScoreAlgorithm(order, drivers, isExpanded);
        }
    }

    /**
     * Optimal Score Algorithm - Main algorithm using weighted scoring
     */
    async optimalScoreAlgorithm(order, drivers, isExpanded = false) {
        const driverScores = await Promise.all(
            drivers.map(driver => this.calculateOptimalScore(driver, order, isExpanded))
        );

        // Sort by score (highest first)
        const rankedDrivers = drivers
            .map((driver, index) => ({
                driver,
                score: driverScores[index],
                breakdown: this.getScoreBreakdown(driver, order, isExpanded)
            }))
            .sort((a, b) => b.score - a.score);

        console.log(`📊 Driver ranking for order ${order.orderId}:`, 
            rankedDrivers.map(r => ({
                driverId: r.driver.driverId,
                score: r.score,
                breakdown: r.breakdown
            }))
        );

        if (rankedDrivers.length === 0) {
            return null;
        }

        return {
            driver: rankedDrivers[0].driver,
            score: rankedDrivers[0].score,
            algorithm: this.algorithms.OPTIMAL_SCORE,
            ranking: rankedDrivers.slice(0, 3), // Top 3 for analysis
            assignmentTime: new Date().toISOString()
        };
    }

    /**
     * Calculate optimal score for a driver-order pair
     */
    async calculateOptimalScore(driver, order, isExpanded = false) {
        let totalScore = 0;

        // 1. Distance Score (35% weight)
        const pickupLocation = order.merchantLocation || order.pickupLocation;
        const distance = this.calculateDistance(driver.currentLocation, pickupLocation);
        const distanceScore = this.calculateDistanceScore(distance, isExpanded);
        totalScore += distanceScore * this.weights.distance;

        // 2. Rating Score (20% weight)
        const ratingScore = this.calculateRatingScore(driver.rating);
        totalScore += ratingScore * this.weights.rating;

        // 3. Efficiency Score (15% weight)
        const efficiencyScore = this.calculateEfficiencyScore(driver);
        totalScore += efficiencyScore * this.weights.efficiency;

        // 4. Vehicle Match Score (10% weight)
        const vehicleScore = this.calculateVehicleMatchScore(driver.vehicle, order);
        totalScore += vehicleScore * this.weights.vehicleMatch;

        // 5. Current Load Score (10% weight)
        const loadScore = this.calculateCurrentLoadScore(driver);
        totalScore += loadScore * this.weights.currentLoad;

        // 6. Priority Score (10% weight)
        const priorityScore = this.calculatePriorityScore(order.priority);
        totalScore += priorityScore * this.weights.priority;

        // Apply zone bonus if same zone
        if (driver.zone === this.getOrderZone(order)) {
            totalScore *= 1.1; // 10% bonus for same zone
        }

        return Math.round(totalScore * 100) / 100;
    }

    /**
     * Get detailed score breakdown for analysis
     */
    getScoreBreakdown(driver, order, isExpanded = false) {
        const pickupLocation = order.merchantLocation || order.pickupLocation;
        const distance = this.calculateDistance(driver.currentLocation, pickupLocation);
        
        return {
            distance: {
                value: distance,
                score: this.calculateDistanceScore(distance, isExpanded),
                weight: this.weights.distance
            },
            rating: {
                value: driver.rating,
                score: this.calculateRatingScore(driver.rating),
                weight: this.weights.rating
            },
            efficiency: {
                value: driver.totalDeliveries,
                score: this.calculateEfficiencyScore(driver),
                weight: this.weights.efficiency
            },
            vehicleMatch: {
                value: driver.vehicle?.type,
                score: this.calculateVehicleMatchScore(driver.vehicle, order),
                weight: this.weights.vehicleMatch
            },
            currentLoad: {
                value: driver.currentDeliveries || 0,
                score: this.calculateCurrentLoadScore(driver),
                weight: this.weights.currentLoad
            },
            priority: {
                value: order.priority,
                score: this.calculatePriorityScore(order.priority),
                weight: this.weights.priority
            }
        };
    }

    /**
     * Distance scoring with falloff curve
     */
    calculateDistanceScore(distance, isExpanded = false) {
        const maxDistance = isExpanded ? 20000 : 10000; // 20km for expanded search, 10km normal
        const optimalDistance = 1000; // 1km optimal
        
        if (distance <= optimalDistance) {
            return 10; // Perfect score for very close drivers
        }
        
        // Exponential falloff after optimal distance
        const falloffRate = isExpanded ? 0.3 : 0.5;
        const score = 10 * Math.exp(-falloffRate * (distance - optimalDistance) / 1000);
        
        return Math.max(0, Math.min(10, score));
    }

    /**
     * Rating score conversion
     */
    calculateRatingScore(rating) {
        if (!rating) return 5; // Default middle score
        return Math.min(10, rating * 2); // Convert 5-star to 10-point scale
    }

    /**
     * Efficiency score based on delivery history
     */
    calculateEfficiencyScore(driver) {
        const deliveries = driver.totalDeliveries || 0;
        const avgDeliveryTime = driver.averageDeliveryTime || 30; // minutes
        
        // Score based on volume and speed
        const volumeScore = Math.min(5, deliveries / 50); // Max 5 points for 250+ deliveries
        const speedScore = Math.max(0, 5 - (avgDeliveryTime - 20) / 5); // Best score for 20min avg
        
        return Math.min(10, volumeScore + speedScore);
    }

    /**
     * Vehicle type matching for order characteristics
     */
    calculateVehicleMatchScore(vehicle, order) {
        if (!vehicle) return 5; // Default score
        
        const vehicleType = vehicle.type?.toUpperCase();
        const orderValue = order.totalAmount || 0;
        const itemCount = order.items?.length || 1;
        const orderSize = this.estimateOrderSize(order);

        const vehicleCapacities = {
            'MOTORCYCLE': { maxValue: 300, maxItems: 5, maxSize: 'small', baseScore: 8 },
            'CAR': { maxValue: 1500, maxItems: 15, maxSize: 'medium', baseScore: 7 },
            'BICYCLE': { maxValue: 150, maxItems: 3, maxSize: 'small', baseScore: 6 },
            'TRUCK': { maxValue: 5000, maxItems: 50, maxSize: 'large', baseScore: 5 },
            'VAN': { maxValue: 3000, maxItems: 30, maxSize: 'large', baseScore: 6 }
        };

        const capacity = vehicleCapacities[vehicleType] || vehicleCapacities['CAR'];
        let score = capacity.baseScore;

        // Penalties for mismatched capacity
        if (orderValue > capacity.maxValue) score -= 3;
        if (itemCount > capacity.maxItems) score -= 2;
        if (orderSize === 'large' && capacity.maxSize === 'small') score -= 2;

        // Bonuses for good matches
        if (orderSize === 'small' && vehicleType === 'MOTORCYCLE') score += 1;
        if (orderSize === 'large' && (vehicleType === 'VAN' || vehicleType === 'TRUCK')) score += 1;

        return Math.max(0, Math.min(10, score));
    }

    /**
     * Current delivery load scoring
     */
    calculateCurrentLoadScore(driver) {
        const currentDeliveries = driver.currentDeliveries || 0;
        const maxCapacity = this.getDriverMaxCapacity(driver);
        
        if (currentDeliveries >= maxCapacity) return 0; // Driver at capacity
        
        const utilizationRate = currentDeliveries / maxCapacity;
        
        // Optimal utilization is around 60-80%
        if (utilizationRate <= 0.6) return 10; // Low utilization, available
        if (utilizationRate <= 0.8) return 8;  // Good utilization
        if (utilizationRate <= 0.9) return 5;  // High utilization
        return 2; // Very high utilization
    }

    /**
     * Priority-based scoring
     */
    calculatePriorityScore(priority) {
        const priorityScores = {
            'urgent': 10,
            'high': 8,
            'normal': 5,
            'low': 3
        };
        
        return priorityScores[priority] || priorityScores['normal'];
    }

    /**
     * Nearest Driver Algorithm - Simple distance-based
     */
    nearestDriverAlgorithm(order, drivers) {
        const pickupLocation = order.merchantLocation || order.pickupLocation;
        
        const driverDistances = drivers.map(driver => ({
            driver,
            distance: this.calculateDistance(driver.currentLocation, pickupLocation)
        }));

        driverDistances.sort((a, b) => a.distance - b.distance);

        if (driverDistances.length === 0) return null;

        return {
            driver: driverDistances[0].driver,
            distance: driverDistances[0].distance,
            algorithm: this.algorithms.NEAREST_DRIVER,
            assignmentTime: new Date().toISOString()
        };
    }

    /**
     * Load Balanced Algorithm - Distributes orders evenly
     */
    loadBalancedAlgorithm(order, drivers) {
        const driverLoads = drivers.map(driver => ({
            driver,
            currentLoad: driver.currentDeliveries || 0,
            capacity: this.getDriverMaxCapacity(driver),
            utilizationRate: (driver.currentDeliveries || 0) / this.getDriverMaxCapacity(driver)
        }));

        // Sort by utilization rate (lowest first)
        driverLoads.sort((a, b) => a.utilizationRate - b.utilizationRate);

        // Filter out drivers at capacity
        const availableDrivers = driverLoads.filter(d => d.utilizationRate < 1);

        if (availableDrivers.length === 0) return null;

        return {
            driver: availableDrivers[0].driver,
            utilizationRate: availableDrivers[0].utilizationRate,
            algorithm: this.algorithms.LOAD_BALANCED,
            assignmentTime: new Date().toISOString()
        };
    }

    /**
     * Zone-based Algorithm - Prioritizes zone matching
     */
    zoneBasedAlgorithm(order, drivers) {
        const orderZone = this.getOrderZone(order);
        
        // Group drivers by zone preference
        const sameZoneDrivers = drivers.filter(d => d.zone === orderZone);
        const adjacentZoneDrivers = drivers.filter(d => d.zone !== orderZone);

        // Prefer same zone drivers
        const targetDrivers = sameZoneDrivers.length > 0 ? sameZoneDrivers : adjacentZoneDrivers;

        if (targetDrivers.length === 0) return null;

        // Use optimal score within the zone
        return this.optimalScoreAlgorithm(order, targetDrivers);
    }

    /**
     * ML Predictive Algorithm - Uses historical patterns
     */
    async mlPredictiveAlgorithm(order, drivers) {
        // Simplified ML-like scoring based on historical patterns
        const historicalData = this.getHistoricalData(order);
        
        const driverPredictions = drivers.map(driver => {
            const prediction = this.predictDeliverySuccess(driver, order, historicalData);
            return { driver, prediction };
        });

        driverPredictions.sort((a, b) => b.prediction.score - a.prediction.score);

        if (driverPredictions.length === 0) return null;

        return {
            driver: driverPredictions[0].driver,
            prediction: driverPredictions[0].prediction,
            algorithm: this.algorithms.ML_PREDICTIVE,
            assignmentTime: new Date().toISOString()
        };
    }

    /**
     * Predict delivery success based on patterns
     */
    predictDeliverySuccess(driver, order, historicalData) {
        // Simplified prediction model
        let score = 5; // Base score

        // Time-based patterns
        const currentHour = new Date().getHours();
        if (driver.preferredHours && driver.preferredHours.includes(currentHour)) {
            score += 2;
        }

        // Weather considerations (mock)
        const weather = this.getCurrentWeather();
        if (weather === 'rain' && driver.vehicle?.type === 'CAR') {
            score += 1;
        }

        // Historical success rate in this area
        const areaSuccessRate = this.getAreaSuccessRate(driver, order);
        score += areaSuccessRate * 3;

        return {
            score: Math.min(10, score),
            factors: {
                timePreference: driver.preferredHours?.includes(currentHour),
                weatherBonus: weather === 'rain' && driver.vehicle?.type === 'CAR',
                areaExperience: areaSuccessRate
            }
        };
    }

    /**
     * Add failed dispatch to retry queue
     */
    addToRetryQueue(order) {
        const retryItem = {
            order,
            attempts: 0,
            maxAttempts: 3,
            nextRetry: Date.now() + (5 * 60 * 1000), // Retry in 5 minutes
            priority: order.priority === 'urgent' ? 1 : 2
        };

        this.dispatchQueue.push(retryItem);
        this.dispatchQueue.sort((a, b) => a.priority - b.priority || a.nextRetry - b.nextRetry);

        if (!this.isProcessingQueue) {
            this.processRetryQueue();
        }
    }

    /**
     * Process the retry queue
     */
    async processRetryQueue() {
        this.isProcessingQueue = true;

        while (this.dispatchQueue.length > 0) {
            const item = this.dispatchQueue[0];
            
            // Check if it's time to retry
            if (Date.now() < item.nextRetry) {
                // Wait until next retry time
                await new Promise(resolve => setTimeout(resolve, item.nextRetry - Date.now()));
            }

            // Remove from queue
            this.dispatchQueue.shift();

            try {
                // Attempt dispatch again
                console.log(`🔄 Retrying dispatch for order ${item.order.orderId} (attempt ${item.attempts + 1})`);
                
                // Import driver API to get fresh driver list
                const { default: DriverAPI } = await import('./driver-api.js');
                const driverAPI = new DriverAPI();
                await driverAPI.initialize();
                
                const availableDrivers = await driverAPI.getAvailableDrivers();
                
                if (availableDrivers.length > 0) {
                    const result = await this.dispatch(item.order, availableDrivers);
                    console.log(`✅ Retry successful for order ${item.order.orderId}`);
                    
                    // Notify order API about successful assignment
                    this.notifySuccessfulRetry(item.order, result);
                } else {
                    // No drivers available, retry later if attempts remaining
                    item.attempts++;
                    if (item.attempts < item.maxAttempts) {
                        item.nextRetry = Date.now() + (10 * 60 * 1000); // 10 minutes
                        this.dispatchQueue.push(item);
                        this.dispatchQueue.sort((a, b) => a.priority - b.priority || a.nextRetry - b.nextRetry);
                    } else {
                        console.log(`❌ Max retry attempts reached for order ${item.order.orderId}`);
                        this.notifyRetryFailure(item.order);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Retry failed for order ${item.order.orderId}:`, error);
                
                item.attempts++;
                if (item.attempts < item.maxAttempts) {
                    item.nextRetry = Date.now() + (15 * 60 * 1000); // 15 minutes
                    this.dispatchQueue.push(item);
                    this.dispatchQueue.sort((a, b) => a.priority - b.priority || a.nextRetry - b.nextRetry);
                }
            }
        }

        this.isProcessingQueue = false;
    }

    /**
     * Notify about successful retry
     */
    notifySuccessfulRetry(order, result) {
        // This would typically call back to the order API
        console.log(`📢 Notifying order system about successful retry assignment for ${order.orderId}`);
    }

    /**
     * Notify about retry failure
     */
    notifyRetryFailure(order) {
        // This would typically escalate to manual dispatch or customer service
        console.log(`📢 Escalating order ${order.orderId} to manual dispatch - automatic retry failed`);
    }

    /**
     * Utility functions
     */
    calculateDistance(coord1, coord2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = coord1.latitude * Math.PI / 180;
        const φ2 = coord2.latitude * Math.PI / 180;
        const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
        const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    getOrderZone(order) {
        const location = order.merchantLocation || order.pickupLocation;
        if (!location) return null;

        // Find closest zone
        let closestZone = null;
        let minDistance = Infinity;

        for (const [zoneId, zone] of Object.entries(this.zones)) {
            const distance = this.calculateDistance(location, zone.center);
            if (distance <= zone.radius && distance < minDistance) {
                minDistance = distance;
                closestZone = zoneId;
            }
        }

        return closestZone;
    }

    getDriverZone(driver) {
        if (driver.zone) return driver.zone;
        
        const location = driver.currentLocation;
        if (!location) return null;

        return this.getOrderZone({ merchantLocation: location });
    }

    getDriverMaxCapacity(driver) {
        const vehicleCapacities = {
            'MOTORCYCLE': 3,
            'CAR': 5,
            'BICYCLE': 2,
            'TRUCK': 10,
            'VAN': 8
        };

        return vehicleCapacities[driver.vehicle?.type?.toUpperCase()] || 3;
    }

    estimateOrderSize(order) {
        const value = order.totalAmount || 0;
        const items = order.items?.length || 1;

        if (value > 200 || items > 5) return 'large';
        if (value > 50 || items > 2) return 'medium';
        return 'small';
    }

    getHistoricalData(order) {
        // Mock historical data - in real implementation, this would query a database
        return {
            averageDeliveryTime: 30,
            successRate: 0.95,
            commonIssues: ['traffic', 'parking'],
            busyHours: [12, 13, 19, 20, 21]
        };
    }

    getCurrentWeather() {
        // Mock weather data - in real implementation, this would call a weather API
        const conditions = ['sunny', 'cloudy', 'rain', 'hot'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    getAreaSuccessRate(driver, order) {
        // Mock area success rate calculation
        return Math.random() * 0.3 + 0.7; // Random between 0.7 and 1.0
    }

    updateMetrics(order, result, assignmentTime) {
        this.metrics.totalDispatches++;
        if (result && result.driver) {
            this.metrics.successfulAssignments++;
        }
        
        this.metrics.averageAssignmentTime = 
            (this.metrics.averageAssignmentTime * (this.metrics.totalDispatches - 1) + assignmentTime) / 
            this.metrics.totalDispatches;

        // Update zone performance
        const zone = this.getOrderZone(order);
        if (zone) {
            if (!this.metrics.zonePerformance[zone]) {
                this.metrics.zonePerformance[zone] = { attempts: 0, successes: 0 };
            }
            this.metrics.zonePerformance[zone].attempts++;
            if (result && result.driver) {
                this.metrics.zonePerformance[zone].successes++;
            }
        }
    }

    /**
     * Get performance analytics
     */
    getAnalytics() {
        const successRate = this.metrics.totalDispatches > 0 ? 
            (this.metrics.successfulAssignments / this.metrics.totalDispatches) * 100 : 0;

        return {
            overview: {
                totalDispatches: this.metrics.totalDispatches,
                successfulAssignments: this.metrics.successfulAssignments,
                successRate: `${successRate.toFixed(2)}%`,
                averageAssignmentTime: `${this.metrics.averageAssignmentTime.toFixed(0)}ms`
            },
            zonePerformance: Object.entries(this.metrics.zonePerformance).map(([zone, data]) => ({
                zone,
                attempts: data.attempts,
                successes: data.successes,
                successRate: `${((data.successes / data.attempts) * 100).toFixed(2)}%`
            })),
            queueStatus: {
                pendingRetries: this.dispatchQueue.length,
                isProcessing: this.isProcessingQueue
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DispatchOptimizer;
} else {
    window.DispatchOptimizer = DispatchOptimizer;
}
