import moment from "moment";
import echarts from "echarts/lib/echarts";

export const now = moment()
  .startOf("day")
  .valueOf();

export const Colors = (function() {
  const _enum = {};

  _enum[(_enum["供图周期"] = "#98c1ff")] = "供图周期";
  _enum[(_enum["组装周期"] = "#6395ec")] = "组装周期";
  _enum[(_enum["完成周期"] = "#256ff2")] = "完成周期";
  _enum[(_enum["交付周期"] = "#014dab")] = "交付周期";

  return _enum;
})();

export function dayDiff(date1, date2) {
  return moment(date1)
    .startOf("day")
    .diff(moment(date2).startOf("day"), "day");
}

/**
 * 获取预期周期数据
 * @param {Array} rawData 原始数据
 * @returns {Array}
 */
export function getExpectedData(rawData) {
  return rawData
    .map(({ id, code, name, nodes }) => {
      return nodes.map(node => {
        // ['预期=0',[id, code, name],"完成周期",_date([2019, 6, 8]), _date([2019, 7, 18])]
        return [0, [id, code, name], ...node.slice(0, 3), undefined, undefined];
      });
    })
    .reduce((prev, current) => [...prev, ...current], []);
}
/**
 * 获取实际周期数据
 * @param {Array} rawData 原始数据
 * @returns {Array}
 */
export function getRunningData(rawData) {
  return rawData
    .map(({ id, code, name, nodes }) => {
      // console.log("nodes", id, now, nodes);
      return nodes
        .map(node => {
          // NODE 格式 ["nodeName",预期开始时间, 预期结束时间, 实际开始时间, 实际结束时间]
          // 如果节点已经完成，有实际开始时间和实际结束时间
          if (node.length === 5) {
            // [ [id, code, name],"完成周期",实际开始时间, 实际结束时间) ]
            return [
              1,
              [id, code, name],
              node[0],
              ...node.slice(3, 5),
              undefined,
              undefined
            ];
          }

          // 如果节点已经开始，但还未结束，则判断是否节点情况：超期|未到期|正常
          if (node.length === 4) {
            // 超期,就是预期结束时间小于当前时间
            // 未到期，预期结束时间大于当前时间
            // 正常，预期结束时间等于当前时间

            const diff = dayDiff(node[2], now);

            // 正常，实际开始时间、当前时间
            // 超期，实际开始时间、当前时间 "over"
            // 未到期，实际开始时间、当前时间，当前时间、预期结束时间

            const tail =
              diff > 0
                ? [now, node[2]]
                : diff < 0
                ? [now, undefined]
                : [undefined, undefined];

            return {
              name: node[0],
              value: [1, [id, code, name], node[0], node[3], now, ...tail]
            };
          }
          // 节点还没开始，没有实际开始时间和实际结束时间
          return undefined;
        })
        .filter(Boolean);
    })
    .reduce((prev, current) => [...prev, ...current], []);
}

/**
 * 渲染自定义数据项
 */
export function renderItem(params, api) {
  // console.log("444444", 121212);
  /*  实现原理:
    如果已经给实际结束时间，表示该阶段已经完成，按正常颜色显示；
    如果没有给实际结束时间，且上一节点已经完成或是开始节点，则表示该节点是当前节点；
    如果没有给实际结束时间，且上一节点没有完成，否则表示节点还没有开始，不需要画图；
    如果是当前节点，则判断是否当前节点的情况，未到期|超期|正常。
    */
  //  数据格式 [[id, code, name],"完成周期",_date([2019, 6, 8]), _date([2019, 7, 18])]
  // 这里进行一些处理，例如，坐标转换。
  // 这里使用 api.value(0) 取出当前 dataItem 中第一个维度的数值。
  const type = api.value(0); // 0 预期，1 实际
  const categoryIndex = api.value(1);
  const nodeName = api.value(2);
  const isOver = api.value(5) && !api.value(6); // 是否逾期
  const isGreen = !!api.value(6); // 是否是未到期
  const color = isOver ? "red" : Colors[nodeName];

  // isGreen &&
  //   console.log(
  //     "categoryIndex",
  //     isGreen,
  //     color,
  //     api.value(0),
  //     api.value(1),
  //     api.value(2),
  //     // moment(api.value(2)).format("YYYY/MM/DD"),
  //     moment(api.value(3)).format("YYYY/MM/DD"),
  //     moment(api.value(4)).format("YYYY/MM/DD"),
  //     moment(api.value(5)).format("YYYY/MM/DD"),
  //     moment(api.value(6)).format("YYYY/MM/DD")
  //   );

  // 这里使用 api.size(...) 获得 Y 轴上数值范围为 1 的一段所对应的像素长度。
  const yGridHeight = api.size([0, 1])[1]; // 获取 y 轴上 一段所对应的像素长度
  const offsetY = yGridHeight * (type === 0 ? 0.45 : 0.31); // 做个下偏移，使之上下游空白间隙
  const height = yGridHeight * (type === 0 ? 0.1 : 0.76); // 获取 y 轴上 一段所对应的像素长度

  const data = [
    [api.value(3), api.value(4)],
    ...(isGreen ? [[api.value(5), api.value(6)]] : [])
  ].map(([s, e], index) => {
    const startPoint = api.coord([s, categoryIndex]);
    const endPoint = api.coord([e, categoryIndex]);
    return {
      type: "rect",
      // silent: true,
      // 如果超出显示范围，则进行剪切
      shape: echarts.graphic.clipRectByRect(
        {
          x: startPoint[0],
          y: startPoint[1] - offsetY,
          width: endPoint[0] - startPoint[0],
          height
        },
        {
          x: params.coordSys.x,
          y: params.coordSys.y,
          width: params.coordSys.width,
          height: params.coordSys.height
        }
      ),
      style: { fill: index === 1 ? "green" : color },
      // styleEmphasis: { fill: "#000" },
      // 修复 hover 上去时覆盖顺序正确的问题
      z2: index
    };
  });

  return { type: "group", children: data };
}

/**
 * 渲染 今日线 和 颜色图注
 */
export function renderTodayLineAndCustomLegend(params, api) {
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
}
