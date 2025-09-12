let data, comments, config;

// JSON 파일들을 로드
async function loadData() {
    try {
        const [dataRes, commentsRes, configRes] = await Promise.all([
            fetch('./data.json'),
            fetch('./comments.json'),
            fetch('./config.json')
        ]);
        
        data = await dataRes.json();
        comments = await commentsRes.json();
        config = await configRes.json();
        
        initializePage();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
    }
}

// 페이지 초기화
function initializePage() {
    document.getElementById('pageTitle').textContent = data.period.title;
    document.getElementById('mainTitle').textContent = data.period.title;
    
    // 세일 정보가 있을 때만 표시
    const salePeriodElement = document.getElementById('salePeriod');
    if (data.period.saleInfo) {
        salePeriodElement.textContent = data.period.saleInfo;
    } else {
        salePeriodElement.style.display = 'none';
    }
    
    createSummaryCards();
    createInsights();
    createCharts();
}

// 요약 카드 생성
function createSummaryCards() {
    const summaryCards = document.getElementById('summaryCards');
    const cardData = [
        { title: '총 활동신청자', value: data.summary.totalApplicants },
        { title: '총 순매출', value: data.summary.totalSales },
        { title: '세일 기간 매출', value: data.summary.salePeriodSales },
        { title: '세일 예고 효과', value: data.summary.presaleEffect },
        { title: '최고 전환율', value: data.summary.maxConversion },
        { title: '최고 ROAS', value: data.summary.maxRoas }
    ];
    
    summaryCards.innerHTML = cardData.map((card, index) => `
        <div class="card ${config.cardColors[index]}">
            <h3>${card.title}</h3>
            <p>${card.value}</p>
        </div>
    `).join('');
}

// 인사이트 섹션 생성
function createInsights() {
    const insights = document.getElementById('insights');
    const tabs = Object.entries(comments.tabs);
    
    insights.innerHTML = `
        <h2>${comments.title}</h2>
        <div class="tab-container">
            <div class="tab-buttons">
                ${tabs.map(([date, _], index) => `
                    <button class="tab-btn ${index === tabs.length - 1 ? 'active' : ''}" onclick="showTab('${date}')">
                        ${date}
                    </button>
                `).join('')}
            </div>
            <div class="tab-content">
                ${tabs.map(([date, tab]) => `
                    <div class="tab-panel ${date === tabs[tabs.length - 1][0] ? 'active' : ''}" id="tab-${date}">
                        <h3>${tab.title}</h3>
                        ${tab.comments.map(comment => `
                            <div class="insight-item">${comment}</div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// 탭 전환 함수
function showTab(date) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`tab-${date}`).classList.add('active');
}

// 기간별 색상 반환
function getColorByPeriod(index) {
    if (index >= config.periods.recoveryStart) return config.colors.recovery;
    if (index >= config.periods.postsaleStart && index <= config.periods.postsaleEnd) return config.colors.postsale;
    if (index >= config.periods.saleStart && index <= config.periods.saleEnd) return config.colors.sale;
    if (index === config.periods.presale) return config.colors.presale;
    return config.colors.normal;
}

// 공통 차트 옵션
const getCommonOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                font: {
                    size: 13,
                    weight: '600'
                },
                padding: 20,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            titleFont: {
                size: 14,
                weight: '600'
            },
            bodyFont: {
                size: 13
            }
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                lineWidth: 1
            },
            ticks: {
                font: {
                    size: 11,
                    weight: '500'
                },
                color: '#6b7280',
                maxRotation: 45
            }
        },
        y: {
            grid: {
                color: 'rgba(0, 0, 0, 0.08)',
                lineWidth: 1
            },
            ticks: {
                font: {
                    size: 11,
                    weight: '500'
                },
                color: '#6b7280'
            }
        }
    }
});

// 차트 생성
function createCharts() {
    createSalesChart();
    createConversionChart();
    createActivityChart();
    createOrderChart();
}

// 1. 매출 차트
function createSalesChart() {
    // 세일 기간 배경색 데이터 생성
    const backgroundColors = data.sales.map((_, index) => {
        if (index === 7) return 'rgba(249, 115, 22, 0.2)'; // 세일 예고 (주황)
        if (index >= 8 && index <= 14) return 'rgba(16, 185, 129, 0.2)'; // 세일 기간 (초록)
        if (index >= 17) return 'rgba(14, 165, 233, 0.2)'; // 회복 기간 (파랑)
        return 'rgba(156, 163, 175, 0.1)'; // 일반 기간 (회색)
    });

    new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '순매출 (백만원)',
                data: data.sales,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: backgroundColors.map(color => color.replace('0.2', '0.8')),
                pointBorderColor: '#667eea',
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBorderWidth: 2
            }]
        },
        options: {
            ...getCommonOptions(),
            plugins: {
                ...getCommonOptions().plugins,
                annotation: {
                    annotations: {
                        presale: {
                            type: 'box',
                            xMin: 7,
                            xMax: 7,
                            backgroundColor: 'rgba(249, 115, 22, 0.15)',
                            borderColor: 'rgba(249, 115, 22, 0.5)',
                            borderWidth: 1
                        },
                        sale: {
                            type: 'box',
                            xMin: 8,
                            xMax: 14,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderColor: 'rgba(16, 185, 129, 0.5)',
                            borderWidth: 1
                        },
                        recovery: {
                            type: 'box',
                            xMin: 17,
                            xMax: 20,
                            backgroundColor: 'rgba(14, 165, 233, 0.15)',
                            borderColor: 'rgba(14, 165, 233, 0.5)',
                            borderWidth: 1
                        }
                    }
                }
            },
            scales: {
                ...getCommonOptions().scales,
                y: {
                    ...getCommonOptions().scales.y,
                    beginAtZero: true,
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            if (value >= 100) return Math.floor(value/100) + '억 ' + (value%100 ? (value%100) + '천만원' : '원');
                            return value + '백만원';
                        }
                    }
                }
            }
        }
    });
}

// 2. 전환율 & ROAS 차트
function createConversionChart() {
    new Chart(document.getElementById('conversionChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '전환율 (%)',
                    data: data.conversion,
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: 'y'
                },
                {
                    label: 'ROAS (%)',
                    data: data.roas,
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                ...getCommonOptions().scales,
                y: {
                    ...getCommonOptions().scales.y,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                y1: {
                    ...getCommonOptions().scales.y,
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// 3. 활동 참여 현황 차트
function createActivityChart() {
    new Chart(document.getElementById('activityChart'), {
        type: 'bar',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '활동 신청자',
                    data: data.activityApplicants,
                    backgroundColor: 'rgba(255, 154, 158, 0.8)',
                    borderColor: '#ff9a9e',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                },
                {
                    label: '링크 채번자',
                    data: data.linkUsers,
                    backgroundColor: 'rgba(168, 237, 234, 0.8)',
                    borderColor: '#a8edea',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false
                }
            ]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                ...getCommonOptions().scales,
                y: {
                    ...getCommonOptions().scales.y,
                    beginAtZero: true,
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            return value + '명';
                        }
                    }
                }
            }
        }
    });
}

// 4. 주문 & 유입 현황 차트
function createOrderChart() {
    new Chart(document.getElementById('orderChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '링크 유입수',
                    data: data.linkInflux,
                    borderColor: '#ffeaa7',
                    backgroundColor: 'rgba(255, 234, 167, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: '주문건수',
                    data: data.orders,
                    borderColor: '#fab1a0',
                    backgroundColor: 'rgba(250, 177, 160, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                ...getCommonOptions().scales,
                y: {
                    ...getCommonOptions().scales.y,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            return value.toLocaleString() + '회';
                        }
                    }
                },
                y1: {
                    ...getCommonOptions().scales.y,
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        ...getCommonOptions().scales.y.ticks,
                        callback: function(value) {
                            return value.toLocaleString() + '건';
                        }
                    }
                }
            }
        }
    });
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', loadData);
