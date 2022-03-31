// 參考網站 https://www.cs.nccu.edu.tw/~mtchi/course/vis21/D3-3/D3-3.html

// TopoJSON
const county_geomap_api =
  'https://hexschool.github.io/tw_revenue/taiwan-geomap.json';
// 業績
const county_revenue_api =
  'https://hexschool.github.io/tw_revenue/tw_revenue.json';

async function getCountyData() {
  try {
    // getData
    const resSaleData = await axios.get(county_revenue_api);
    const resMapData = await axios.get(county_geomap_api);

    const saleData = resSaleData.data[0].data;
    const mapDataTo = resMapData.data;

    // TopoJSON 轉GeoJSON
    const mapDataGe = topojson.feature(
      mapDataTo,
      mapDataTo.objects.COUNTY_MOI_1090820
    );
    drawMap(mapDataGe, saleData);
  } catch (err) {}
}

function drawMap(mapData, saleData) {
  // 地圖色碼
  const colorScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.min(saleData, (d) => +d.revenue.replaceAll(',', '')),
      d3.max(saleData, (d) => +d.revenue.replaceAll(',', '')),
    ])
    .range([
      '#d6d6d6', // 預設
      '#bcafb0', // 顏色範圍=>深色
      '#ec595c', // 顏色範圍=>淺色
    ]);

  let svg = d3
    .select('.map') //map位置
    .append('svg')
    .style('height', 500)
    .style('width', 500)
    .style('background', '#202d49'); // 背景色

  let tooltip = d3
    .select('#tooltip')
    .attr('fill', '#f3dc71') // 文字顏色
    .style('position', 'absolute')
    .style('width', 150)
    .style('height', 50)
    .style('display', 'none');

  d3.select('.map').on('mousemove', function (e) {
    tooltip.style('left', e.layerX + 20).style('top', e.layerY + 35);
  });

  // 設定地圖投影模式 並使用 .center([X, Y]) 來指定中心的經緯度，.scale() 指定縮放的大小
  const projection = d3.geoMercator().center([123, 24]).scale(5500);

  //生成 geoPath 物件，內容是地圖的外框座標
  const path = d3.geoPath().projection;

  //用 geoPath 物件在 svg 上畫上地圖，並導入資料
  const geoPath = svg
    .selectAll('.geo-path')
    .data(mapData.features)
    .join('path')
    .attr('class', 'geo-path')
    .attr('d', path(projection))
    .attr('fill', (d) => {
      // 縣市的銷售資料
      const city = d.properties.COUNTYNAME;
      const sale = saleData.find((item) => item.city === city);
      return colorScale(sale ? +sale.revenue.replaceAll(',', '') : 0);
    })
    .attr('stroke', '#3f2ab2') // 縣市的線條顏色
    .attr('stroke-width', '1px') // 縣市的線條寬度
    .on('mouseover', function (e) {
      d3.select(this).attr('stroke-width', '2.5px'); // 縣市的線條寬度
      d3.select(this).select(function (d) {
        let city = d.properties.COUNTYNAME;
        saleData.forEach((item) => {
          if (item.city === city) {
            d.revenue = item.revenue;
          }
        });
        // 顯示 hover 文字
        tooltip
          .select('text')
          .html(`${d.properties.COUNTYNAME}, ${d.revenue ? d.revenue : 0}`);
        tooltip.transition().style('display', 'block');
      });
    })
    .on('mouseleave', function (e) {
      d3.select(this).attr('stroke-width', '1px'); // 縣市的線條寬度
      tooltip.transition().style('display', 'none');
    });
}
getCountyData();
