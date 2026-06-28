const Bin = require('../models/Bin');

const startSimulation = (io) => {
  console.log('IoT Simulation Engine started. Running every 30 seconds.');
  
  setInterval(async () => {
    try {
      const bins = await Bin.find();
      
      for (let bin of bins) {
        // Calculate fill level increment
        let increment = 0;
        if (bin.lowTraffic) {
          // 0.5% - 1%
          increment = 0.5 + Math.random() * 0.5;
        } else {
          // 1% - 4%
          increment = 1 + Math.random() * 3;
        }
        
        let oldFillLevel = bin.fillLevel;
        let newFillLevel = Math.min(100, bin.fillLevel + increment);
        
        // Round to 1 decimal place
        newFillLevel = Math.round(newFillLevel * 10) / 10;
        bin.fillLevel = newFillLevel;
        
        let oldStatus = bin.status;
        
        // Update status based on capacity thresholds
        // (excluding smell_reported, which is citizen reported and must remain purple until collected)
        if (bin.status !== 'smell_reported') {
          if (newFillLevel >= 90) {
            bin.status = 'critical';
          } else if (newFillLevel >= 60) {
            bin.status = 'warning';
          } else {
            bin.status = 'normal';
          }
        } else if (bin.status === 'smell_reported' && newFillLevel >= 90) {
          // If a smell reported bin gets critical, do we set it to critical or keep it purple?
          // The prompt says: "When any bin hits 90% fill: Auto-set status to critical".
          // So let's update it to critical.
          bin.status = 'critical';
        }
        
        // Trigger alerts when changing to critical
        if (bin.status === 'critical' && oldStatus !== 'critical') {
          const alertMsg = {
            id: `${bin.binId}-${Date.now()}`,
            binId: bin.binId,
            message: `Warning: Bin ${bin.binId} in ${bin.location.name} has reached ${newFillLevel}% capacity!`,
            fillLevel: newFillLevel,
            timestamp: new Date()
          };
          
          // Emit socket notification to admin
          if (io) {
            io.emit('admin_notification', alertMsg);
          }
        }
        
        // Save only if changes occurred
        if (oldFillLevel !== newFillLevel || oldStatus !== bin.status) {
          await bin.save();
          
          // Emit real-time updates for map markers
          if (io) {
            io.emit('bin_update', bin);
          }
        }
      }
    } catch (error) {
      console.error('Error running IoT simulation:', error);
    }
  }, 30000); // 30 seconds
};

module.exports = { startSimulation };
