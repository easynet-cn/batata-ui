// Tree-shaken ECharts setup - only imports chart types and components actually used in the project.
// Dashboard uses: PieChart (health distribution, config types)
// ServiceTopologyGraph uses: GraphChart (topology visualization)

import { use, init } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, GraphChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, PieChart, GraphChart, TitleComponent, TooltipComponent, LegendComponent])

export { init }
export type { ECharts, EChartsCoreOption as EChartsOption } from 'echarts/core'
