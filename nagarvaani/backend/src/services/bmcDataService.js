const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_PATH = path.join(__dirname, '../../data/Mumbai_BMC_Complaints.csv');

/**
 * Service to parse historical BMC complaint data and generate statistics
 */
const getBmcStatistics = () => {
  return new Promise((resolve, reject) => {
    const stats = {
      yearlyVolume: {}, // { "2015": 1000, "2016": 1200 }
      issueDistribution: {}, // { "Roads": 500, "Drainage": 200 }
      wardPerformance: {}, // { "A": { closed: 80, open: 20, rate: 80 } }
      topWards: [],
      totalComplaints: 0
    };

    if (!fs.existsSync(CSV_PATH)) {
      return reject(new Error('BMC Complaints CSV not found in backend data store.'));
    }

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Aggregate Total Complaints
        stats.totalComplaints++;

        // Yearly Volume
        const year = row['Year'];
        if (year) {
          stats.yearlyVolume[year] = (stats.yearlyVolume[year] || 0) + 1;
        }

        // Issue Distribution
        const issue = row['Issue Type'];
        if (issue) {
          stats.issueDistribution[issue] = (stats.issueDistribution[issue] || 0) + 1;
        }

        // Ward Performance
        const ward = row['Ward Code'];
        const closed = parseInt(row['Complaints Closed']) || 0;
        const pending = parseInt(row['Complaints Open Pending']) || 0;
        
        if (ward) {
          if (!stats.wardPerformance[ward]) {
            stats.wardPerformance[ward] = { closed: 0, pending: 0, total: 0 };
          }
          stats.wardPerformance[ward].closed += closed;
          stats.wardPerformance[ward].pending += pending;
          stats.wardPerformance[ward].total += (closed + pending);
        }
      })
      .on('end', () => {
        // Calculate Closure Rates and Sort Wards
        const wardList = Object.entries(stats.wardPerformance).map(([code, data]) => {
          const rate = data.total > 0 ? (data.closed / data.total * 100).toFixed(1) : 0;
          return { code, ...data, rate: parseFloat(rate) };
        });

        stats.topWards = wardList
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 10);

        resolve(stats);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = { getBmcStatistics };
