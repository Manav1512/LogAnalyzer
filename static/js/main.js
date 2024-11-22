document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const loadingIndicator = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const logFileInput = document.getElementById('logFile');

    // File input custom styling
    if (logFileInput) {
        logFileInput.addEventListener('change', function() {
            const fileChosen = document.getElementById('file-chosen');
            fileChosen.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(uploadForm);
            const logFile = document.getElementById('logFile');

            // Reset previous state
            loadingIndicator.classList.remove('hidden');
            errorDiv.classList.add('hidden');

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the analysis result in session storage
                    sessionStorage.setItem('logAnalysis', JSON.stringify(data));
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    throw new Error(data.error || 'Unknown error occurred');
                }
            } catch (error) {
                loadingIndicator.classList.add('hidden');
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Dashboard page specific logic
    if (window.location.pathname === '/dashboard') {
        const analysisData = JSON.parse(sessionStorage.getItem('logAnalysis'));

        if (analysisData) {
            // Update stats cards
            document.getElementById('totalLogs').textContent = analysisData.total_logs || '-';
            document.getElementById('uniqueUsers').textContent = analysisData.unique_users || '-';
            document.getElementById('uniqueIPs').textContent = analysisData.unique_ips || '-';
            document.getElementById('uniqueEvents').textContent = analysisData.unique_events || '-';

            // Severity Breakdown Chart
            const severityCtx = document.getElementById('severityChart');
            const severityData = [
                analysisData.severity_breakdown.high || 0,
                analysisData.severity_breakdown.medium || 0,
                analysisData.severity_breakdown.low || 0
            ];
            const totalSeverity = severityData.reduce((a, b) => a + b, 0);
            const severityPercentages = severityData.map(val => ((val / totalSeverity) * 100).toFixed(1));

            // Update severity percentages display
            const severityPercentageDiv = document.getElementById('severityPercentage');
            severityPercentageDiv.innerHTML = `
                High: ${severityPercentages[0]}% | 
                Medium: ${severityPercentages[1]}% | 
                Low: ${severityPercentages[2]}%
            `;

            new Chart(severityCtx, {
                type: 'bar',
                data: {
                    labels: ['High', 'Medium', 'Low'],
                    datasets: [{
                        data: severityData,
                        backgroundColor: ['#dc3545', '#ffc107', '#28a745']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

            // Peak Hours Chart
            const peakHoursCtx = document.getElementById('peakHoursChart');
            const peakHours = analysisData.peak_hours || [];
            new Chart(peakHoursCtx, {
                type: 'bar',
                data: {
                    labels: peakHours.map(h => `Hour ${h.hour}`),
                    datasets: [{
                        label: 'Log Count',
                        data: peakHours.map(h => h.count),
                        backgroundColor: 'rgba(74, 108, 247, 0.6)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Suspicious Logs Table
            const suspiciousLogsBody = document.getElementById('suspiciousLogsBody');
            const suspiciousLogs = analysisData.suspicious_logs || [];
            suspiciousLogsBody.innerHTML = suspiciousLogs.map(log => `
                <tr>
                    <td>${log.log}</td>
                    <td>${log.ip}</td>
                    <td>${log.reason}</td>
                    <td>${log.mitigation}</td>
                </tr>
            `).join('');
        }
    }

    // Adjust canvas size when the window is resized
    window.addEventListener('resize', () => {
        const charts = document.querySelectorAll('canvas');
        charts.forEach(chart => {
            chart.style.width = '100%';
            chart.style.height = 'auto';
        });
    });
});
