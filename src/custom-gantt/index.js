import React from "react";
import moment from "moment";
// 引入 ECharts 主模块
// import echarts from "echarts/dist/echarts";
import echarts from "echarts/lib/echarts";

import "echarts/map/js/china";
// 引入柱状图
import "echarts/lib/chart/custom";

// 引入提示框和标题组件
import "echarts/lib/component/grid";

import dataSource from "./example-raw-data";
import { getExpectedData, getRunningData, renderItem, Colors } from "./utils";
const expectedData = getExpectedData(dataSource);
const runningData = getRunningData(dataSource);
console.log("dataSource0", runningData);

var option = {
  tooltip: {
    formatter: function(params) {
      if (!params.value) return "";

      // const type = params.value[0];

      const [type, , name, start, end, rstart, rend] = params.value;
      const isOver = type === 1 && rstart && !rend; //
      const isGreen = type === 1 && !!rend;

      // console.log(
      //   "tooltip",
      //   isOver,
      //   isGreen,
      //   type,
      //   title,
      //   name,
      //   start,
      //   end,
      //   rstart,
      //   rend,
      //   moment(start).format("YYYY/MM/DD"),
      //   moment(end).format("YYYY/MM/DD"),
      //   moment(rstart).format("YYYY/MM/DD"),
      //   moment(rend).format("YYYY/MM/DD")
      // );
      const overDays = isOver ? moment(end).diff(moment(start), "day") : 0;
      const leftDays = isGreen ? moment(rend).diff(moment(rstart), "day") : 0;

      return `${type === 0 ? "预期" : "实际"}${name}${
        isOver
          ? `，已逾期 ${overDays} 天`
          : isGreen
          ? `，剩余 ${leftDays} 天`
          : ""
      } <br />
      ${moment(start).format("YYYY/MM/DD")} ~
      ${moment(isGreen ? rend : end).format("YYYY/MM/DD")}`;
    }
  },
  // title: {
  //   text: "Profile",
  //   left: "center"
  // },
  // dataZoom: [
  //   {
  //     type: "slider",
  //     filterMode: "weakFilter",
  //     showDataShadow: false,
  //     top: 400,
  //     height: 10,
  //     borderColor: "transparent",
  //     backgroundColor: "#e2e2e2",
  //     handleIcon:
  //       "M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z", // jshint ignore:line
  //     handleSize: 20,
  //     handleStyle: {
  //       shadowBlur: 6,
  //       shadowOffsetX: 1,
  //       shadowOffsetY: 2,
  //       shadowColor: "#aaa"
  //     },
  //     labelFormatter: ""
  //   },
  //   {
  //     type: "inside",
  //     filterMode: "weakFilter"
  //   }
  // ],
  // grid: {
  //   height: 300
  // },
  // legend: {
  //   // top: 10,
  //   data: ["预期周期", "实际周期"],
  //   itemGap: 20
  // },
  // axisPointer: {
  //   link: { xAxisIndex: "all" },
  //   label: {
  //     backgroundColor: "#777"
  //   }
  // },
  xAxis: {
    type: "value",
    // triggerTooltip: false,
    silent: true,
    scale: true,
    // min: moment("2019-1-1").valueOf(),
    // max: moment()
    //   .add(90, "day")
    //   .startOf("day")
    //   .valueOf(),
    // interval:10000000,
    splitLine: {
      show: true,
      lineStyle: { type: "dashed" }
    },

    axisPointer: {
      show: true,
      label: {
        formatter: function(data) {
          // console.log("formatter", data.value);
          return moment(data.value).format("YYYY/M/D");
        }
      }
    },

    axisLabel: {
      formatter: function(val) {
        console.log("axisLabel", val);
        return moment(val).format("YYYY/M/D");
      }
    }
  },
  yAxis: {
    type: "category",
    boundaryGap: true, // ["20%", "20%"],
    // splitLine: {
    //   //网格线
    //   show: false
    // },
    // splitArea: {
    //   show: false,
    //   // lineStyle: { type: "dashed" }
    // },
    axisLine: {
      //y轴
      show: true
    },
    nameTextStyle: { lineHeight: 30 },
    axisLabel: {
      lineHeight: 18,
      formatter: function(val) {
        console.log("y-axisLabel", val);

        return val ? val.slice(1).join("\n") : "";
      }
    }
    // data: categories
  },
  series: [
    // 画预期
    {
      name: "预期周期",
      type: "custom",
      renderItem: renderItem,
      itemStyle: {
        normal: {
          opacity: 0.8
        }
      },
      encode: {
        x: [3, 4, 5, 6], // 维度 2,3,4 映射到 x 轴
        y: 1, // 把维度 0  映射到 y 轴
        tooltip: 1,
        legend: 1
      },
      markLine: moment()
        .startOf("day")
        .valueOf(),
      data: expectedData
    },
    //
    {
      type: "custom",
      name: "实际周期",
      renderItem: renderItem,
      itemStyle: {
        normal: {
          opacity: 0.8
        }
      },
      encode: {
        x: [3, 4, 5, 6], // 维度 2,3,4 映射到 x 轴
        y: 1 // 把维度 0  映射到 y 轴
      },
      data: runningData
    },
    {
      type: "custom",
      silent: true,
      renderItem: function(params, api) {
        const yGridHeight = api.size([0, 1])[1];
        const coord = api.coord([api.value(0), 0]);
        // 添加今日线
        const todayLine = {
          type: "line",
          shape: {
            x1: coord[0],
            y1: params.coordSys.y - yGridHeight * 0.25,
            x2: coord[0],
            y2: params.coordSys.height + params.coordSys.y
          },
          style: { stroke: "red" }
        };
        // 画颜色示意图
        const children = ["供图周期", "组装周期", "完成周期", "交付周期"]
          .map((text, i) => {
            return [
              {
                type: "rect",
                shape: {
                  x: params.coordSys.x + 24 * text.length * i,
                  y: 14,
                  width: 25,
                  height: 14
                },
                style: { fill: Colors[text] }
              },
              {
                type: "text",
                style: {
                  text: text,
                  font: 'normal 12px "Microsoft YaHei"',
                  fill: "#333",
                  x: params.coordSys.x + 24 * text.length * i + 25 + 4,
                  y: 14
                }
              }
            ];
          })
          .reduce((prev, current) => [...prev, ...current], [todayLine]);

        return { type: "group", children };
      },
      // encode: {
      //   // x: [0] // 维度 2,3,4 映射到 x 轴
      //   // y:  // 把维度 0  映射到 y 轴
      //   // tooltip: 1
      // },
      data: [
        moment()
          .startOf("day")
          .valueOf()
      ]
    }
  ]
};

class CustomProfile extends React.Component {
  componentDidMount() {
    this.echart = echarts.init(this.echartsContainer, null, {
      renderer: "svg"
    });

    this.echart.setOption(option);
  }

  render() {
    return (
      <div
        ref={el => {
          this.echartsContainer = el;
        }}
        style={{ height: "100vh" }}
      />
    );
  }
}

export default CustomProfile;
