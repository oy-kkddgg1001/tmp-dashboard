let data, comments, config;
let chartInstances = {}; // 차트 인스턴스 저장
let originalData = {}; // 원본 데이터 저장

// 줌 리셋 함수
function resetZoom(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].resetZoom();
    }
}

// 데이터 필터링 함수
function filterData(period) {
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    let startIndex = 0;
    let endIndex = data.dates.length - 1;

    switch(period) {
        case 'recent':
            startIndex = Math.max(0, data.dates.length - 7);
            break;
        case 'month':
            startIndex = Math.max(0, data.dates.length - 30);
            break;
        case 'sale':
            startIndex = 8; // 세일 시작
            endIndex = 14; // 세일 종료
            break;
        case 'all':
        default:
            // 전체 데이터 사용
            break;
    }

    // 필터링된 데이터로 차트 업데이트
    updateChartsWithFilter(startIndex, endIndex);
}

// 필터링된 데이터로 차트 업데이트
function updateChartsWithFilter(startIndex, endIndex) {
    const filteredDates = data.dates.slice(startIndex, endIndex + 1);
    const filteredSales = data.sales.slice(startIndex, endIndex + 1);
    const filteredConversion = data.conversion.slice(startIndex, endIndex + 1);
    const filteredRoas = data.roas.slice(startIndex, endIndex + 1);
    const filteredApplicants = data.activityApplicants.slice(startIndex, endIndex + 1);
    const filteredLinkUsers = data.linkUsers.slice(startIndex, endIndex + 1);
    const filteredOrders = data.orders.slice(startIndex, endIndex + 1);
    const filteredInflux = data.linkInflux.slice(startIndex, endIndex + 1);

    // 각 차트 업데이트
    if (chartInstances.salesChart) {
        chartInstances.salesChart.data.labels = filteredDates;
        chartInstances.salesChart.data.datasets[0].data = filteredSales;
        chartInstances.salesChart.update();
    }

    if (chartInstances.conversionChart) {
        chartInstances.conversionChart.data.labels = filteredDates;
        chartInstances.conversionChart.data.datasets[0].data = filteredConversion;
        chartInstances.conversionChart.data.datasets[1].data = filteredRoas;
        chartInstances.conversionChart.update();
    }

    if (chartInstances.activityChart) {
        chartInstances.activityChart.data.labels = filteredDates;
        chartInstances.activityChart.data.datasets[0].data = filteredApplicants;
        chartInstances.activityChart.data.datasets[1].data = filteredLinkUsers;
        chartInstances.activityChart.update();
    }

    if (chartInstances.orderChart) {
        chartInstances.orderChart.data.labels = filteredDates;
        chartInstances.orderChart.data.datasets[0].data = filteredOrders;
        chartInstances.orderChart.data.datasets[1].data = filteredInflux;
        chartInstances.orderChart.update();
    }
}

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
    // 원본 데이터 저장
    originalData = JSON.parse(JSON.stringify(data));
    
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
    createCommentTabs();
}

// 요약 카드 생성
function createSummaryCards() {
    const summaryCards = document.getElementById('summaryCards');
    const cardData = [
        { title: '총 활동신청자', value: data.summary.totalApplicants },
        { title: '총 순매출', value: data.summary.totalSales },
        { title: '9월 세일 매출', value: data.summary.salePeriodSales },
        { title: '세일 예고 효과', value: data.summary.presaleEffect },
        { title: '최고 전환율', value: data.summary.maxConversion },
        { title: '최고 ROAS', value: data.summary.maxRoas }
    ];

    summaryCards.innerHTML = cardData.map(card => `
        <div class="summary-card">
            <div class="card-title">${card.title}</div>
            <div class="card-value">${card.value}</div>
        </div>
    `).join('');
}

// 인사이트 생성
function createInsights() {
    const insightsContainer = document.getElementById('insights');
    insightsContainer.innerHTML = `
        <div class="insight-card highlight">
            <div class="insight-title">🎯 최신 하이라이트</div>
            <div class="insight-content">${data.summary.recentHighlight}</div>
        </div>
    `;
}

// 공통 차트 옵션
const getCommonOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
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
        },
        zoom: {
            zoom: {
                wheel: {
                    enabled: true,
                },
                pinch: {
                    enabled: true
                },
                mode: 'x',
            },
            pan: {
                enabled: true,
                mode: 'x',
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
                    size: 10,
                    weight: '500'
                },
                color: '#6b7280',
                maxRotation: 45,
                maxTicksLimit: 15
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
    // 포인트 크기 조정 (최신 데이터 강조)
    const pointRadius = data.sales.map((_, index) => {
        if (index >= 28) return 7; // 최신 5일 데이터 크게 (9/19-9/23)
        if (index === 27) return 8; // 9/18 신기록 가장 크게
        return 5;
    });

    chartInstances.salesChart = new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '순매출 (백만원)',
                data: data.sales,
                borderColor: '#667eea',
                backgroundColor: (ctx) => {
                    const canvas = ctx.chart.ctx;
                    const gradient = canvas.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
                    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: data.sales.map((_, index) => {
                    if (index >= 28) return '#ec4899'; // 최신 데이터 핑크
                    if (index === 27) return '#dc2626'; // 9/18 신기록 빨간색
                    return '#667eea';
                }),
                pointBorderColor: data.sales.map((_, index) => {
                    if (index >= 28) return '#ec4899'; // 최신 데이터 핑크 테두리
                    if (index === 27) return '#dc2626'; // 9/18 신기록 빨간색 테두리
                    return '#667eea';
                }),
                pointRadius: pointRadius,
                pointHoverRadius: data.sales.map((_, index) => {
                    if (index >= 28) return 9;
                    if (index === 27) return 10;
                    return 7;
                }),
                pointBorderWidth: 2
            }]
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
    // 전환율 포인트 색상 (18.1% 신기록 강조)
    const conversionPointColors = data.conversion.map((value, index) => {
        if (value >= 18) return '#dc2626'; // 18% 이상 빨간색
        if (index >= 28) return '#ec4899'; // 최신 데이터 핑크
        return '#11998e';
    });

    // ROAS 포인트 색상
    const roasPointColors = data.roas.map((value, index) => {
        if (value >= 2100) return '#dc2626'; // 2100% 이상 빨간색
        if (index >= 28) return '#f59e0b'; // 최신 데이터 주황색
        return '#8b5cf6';
    });

    chartInstances.conversionChart = new Chart(document.getElementById('conversionChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '구매 전환율 (%)',
                    data: data.conversion,
                    borderColor: '#11998e',
                    backgroundColor: 'rgba(17, 153, 142, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: conversionPointColors,
                    pointBorderColor: conversionPointColors,
                    pointRadius: data.conversion.map((value, index) => {
                        if (value >= 18) return 8; // 18% 이상 크게
                        if (index >= 28) return 6; // 최신 데이터
                        return 4;
                    }),
                    pointHoverRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'ROAS (%)',
                    data: data.roas,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: roasPointColors,
                    pointBorderColor: roasPointColors,
                    pointRadius: data.roas.map((value, index) => {
                        if (value >= 2100) return 8; // 2100% 이상 크게
                        if (index >= 28) return 6; // 최신 데이터
                        return 4;
                    }),
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                ...getCommonOptions().scales,
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#11998e',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: '전환율 (%)',
                        color: '#11998e',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#8b5cf6',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'ROAS (%)',
                        color: '#8b5cf6',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// 3. 활동 참여 현황 차트
function createActivityChart() {
    chartInstances.activityChart = new Chart(document.getElementById('activityChart'), {
        type: 'bar',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '활동 신청자',
                    data: data.activityApplicants,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: '#667eea',
                    borderWidth: 1
                },
                {
                    label: '링크 채번자',
                    data: data.linkUsers,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1
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
    // 주문건수 포인트 색상 (1,457건 신기록 강조)
    const orderPointColors = data.orders.map((value, index) => {
        if (value >= 1400) return '#dc2626'; // 1400건 이상 빨간색
        if (index >= 28) return '#f59e0b'; // 최신 데이터 주황색
        return '#f97316';
    });

    // 링크 유입 포인트 색상
    const influxPointColors = data.linkInflux.map((value, index) => {
        if (value >= 20000) return '#dc2626'; // 20000회 이상 빨간색
        if (index >= 28) return '#06b6d4'; // 최신 데이터 청록색
        return '#0ea5e9';
    });

    chartInstances.orderChart = new Chart(document.getElementById('orderChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: '주문건수',
                    data: data.orders,
                    borderColor: '#f97316',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: orderPointColors,
                    pointBorderColor: orderPointColors,
                    pointRadius: data.orders.map((value, index) => {
                        if (value >= 1400) return 8; // 1400건 이상 크게
                        if (index >= 28) return 6; // 최신 데이터
                        return 4;
                    }),
                    pointHoverRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: '링크 유입수',
                    data: data.linkInflux,
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: influxPointColors,
                    pointBorderColor: influxPointColors,
                    pointRadius: data.linkInflux.map((value, index) => {
                        if (value >= 20000) return 8; // 20000회 이상 크게
                        if (index >= 28) return 6; // 최신 데이터
                        return 4;
                    }),
                    pointHoverRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getCommonOptions(),
            scales: {
                ...getCommonOptions().scales,
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)',
                        lineWidth: 1
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#f97316',
                        callback: function(value) {
                            return value + '건';
                        }
                    },
                    title: {
                        display: true,
                        text: '주문건수',
                        color: '#f97316',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        color: '#0ea5e9',
                        callback: function(value) {
                            return value + '회';
                        }
                    },
                    title: {
                        display: true,
                        text: '링크 유입수',
                        color: '#0ea5e9',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// 탭 전환 함수
function showTab(tabId) {
    // 모든 탭 버튼과 내용 숨기기
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // 선택된 탭 활성화
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// 코멘트 탭 생성
function createCommentTabs() {
    const tabsContainer = document.getElementById('commentTabs');
    const contentContainer = document.getElementById('commentContent');
    
    const tabKeys = Object.keys(comments.tabs);
    
    // 탭 버튼 생성
    tabsContainer.innerHTML = tabKeys.map(key => `
        <button class="tab-btn ${key === tabKeys[tabKeys.length - 1] ? 'active' : ''}" 
                onclick="showTab('${key}')">${comments.tabs[key].title}</button>
    `).join('');
    
    // 탭 내용 생성
    contentContainer.innerHTML = tabKeys.map(key => `
        <div id="${key}" class="tab-content ${key === tabKeys[tabKeys.length - 1] ? 'active' : ''}">
            <h3>${comments.tabs[key].title}</h3>
            <ul class="comment-list">
                ${comments.tabs[key].comments.map(comment => `<li>${comment}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});
