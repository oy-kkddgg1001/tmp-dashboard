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
    document.getElementById('salePeriod').textContent = data.period.saleInfo;
    
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
    insights.innerHTML = `
        <h2>${comments.title}</h2>
        ${comments.insights.map(insight => `
            <div class="insight-item">
                <strong>${insight.title}</strong> ${insight.content}
            </div>
        `).join('')}
    `;
}

// 기간별 색상 반환
function getColorByPeriod(index) {
    if (index >= config.periods.recoveryStart) return config.colors.recovery;
    if (index >= config.periods.postsaleStart && index <= config.periods.postsaleEnd) return config.colors.postsale;
    if (index >= config.periods.saleStart && index <= config.periods.saleEnd) return config.colors.sale;
    if (index === config.periods.presale) return config.colors.presale;
    return config.colors.normal;
}

// 차트 생성
function createCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
    };

    // 1. 매출 차트
    new Chart(document.getElementById('salesChart'), {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: '순매출 (백만원)',
                data: data.sales,
                borderColor: config.colors.sale,
                backgroundColor: `${config.colors.sale}1A`,
                borderWidth: config.charts.sales.borderWidth,
                fill: config.charts.sales.fill,
                tension: config.charts.sales.tension,
                pointBackgroundColor: data.sales.map((_, index) => getColorByPeriod(index)),
                pointBorderColor: data.sales.map((_, index) => getColorByPeriod(index)),
                pointRadius: config.charts.sales.pointRadius
            }]
        },
        options: { ...commonOptions, scales: { y: { beginAtZero: true } } }
    });

    // 2. 전환율 & ROAS 차트
    new Chart(document.getElementById('conversionChart'), {
        type: 'bar',
        data: {
            labels: data.dates,
            datasets: [{
                label: '전환율 (%)',
                data: data.conversion,
                backgroundColor: data.conversion.map((_, index) => getColorByPeriod(index)),
                yAxisID: 'y'
            }, {
                label: 'ROAS (%)',
                data: data.roas,
                type: 'line',
                borderColor: config.colors.warning,
                borderWidth: 3,
                yAxisID: 'y1'
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                y: { beginAtZero: true, position: 'left' },
                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });

    // 3. 활동 참여 차트
    new Chart(document.getElementById('activityChart'), {
        type: 'bar',
        data: {
            labels: data.dates,
            datasets: [{
                label: '활동신청자',
                data: data.activityApplicants,
                backgroundColor: data.activityApplicants.map((_, index) => {
                    if (index >= config.periods.recoveryStart) return config.colors.recovery;
                    if (index >= config.periods.saleStart && index <= config.periods.saleEnd) return config.colors.sale;
                    if (index === config.periods.presale) return config.colors.presale;
                    return config.colors.accent;
                })
            }, {
                label: '링크채번자',
                data: data.linkUsers,
                backgroundColor: config.colors.info
            }]
        },
        options: { ...commonOptions, scales: { y: { beginAtZero: true } } }
    });

    // 4. 주문 & 유입 차트
    new Chart(document.getElementById('orderChart'), {
        type: 'bar',
        data: {
            labels: data.dates,
            datasets: [{
                label: '주문건수',
                data: data.orders,
                backgroundColor: data.orders.map((_, index) => getColorByPeriod(index)),
                yAxisID: 'y'
            }, {
                label: '링크유입',
                data: data.linkInflux,
                type: 'line',
                borderColor: config.colors.postsale,
                borderWidth: 3,
                yAxisID: 'y1'
            }]
        },
        options: {
            ...commonOptions,
            scales: {
                y: { beginAtZero: true, position: 'left' },
                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', loadData);
