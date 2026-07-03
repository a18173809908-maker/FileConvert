export type DownloadTool = {
  slug: string
  name: string
  summary: string
  category: string
  license: '开源' | '免费' | '免费个人版'
  platforms: string[]
  homepage: string
  sourceUrl?: string
  cloudLinks: Array<{
    name: string
    url: string
    code?: string
  }>
  highlights: string[]
  description: string
  useCases: string[]
}

export const downloadTools: DownloadTool[] = [
  {
    slug: '7zip',
    name: '7-Zip',
    summary: '轻量、稳定的压缩解压工具，适合处理 zip、7z、rar 等常见压缩包。',
    category: '压缩解压',
    license: '开源',
    platforms: ['Windows'],
    homepage: 'https://www.7-zip.org/',
    sourceUrl: 'https://sourceforge.net/projects/sevenzip/',
    cloudLinks: [],
    highlights: ['支持 7z/zip/rar 等常见格式', '体积小，占用低', '适合日常批量解压'],
    description:
      '7-Zip 是经典的开源压缩解压工具，界面朴素但稳定可靠。它适合替代臃肿的商业压缩软件，用来处理日常下载、备份和文件打包。',
    useCases: ['解压网上下载的资料包', '把多个文件打包发送', '处理大体积归档文件'],
  },
  {
    slug: 'handbrake',
    name: 'HandBrake',
    summary: '开源视频转码工具，适合压缩视频、转换 MP4/MKV 和调整编码参数。',
    category: '视频处理',
    license: '开源',
    platforms: ['Windows', 'macOS', 'Linux'],
    homepage: 'https://handbrake.fr/',
    sourceUrl: 'https://github.com/HandBrake/HandBrake',
    cloudLinks: [],
    highlights: ['支持常见视频容器', '内置多种设备预设', '适合视频压缩和转码'],
    description:
      'HandBrake 适合把体积较大的视频转成更容易分享和保存的格式。它支持多平台，参数足够细，也有预设可以快速上手。',
    useCases: ['压缩录屏文件', '把 MKV 转成 MP4', '批量整理视频素材'],
  },
  {
    slug: 'obs-studio',
    name: 'OBS Studio',
    summary: '开源录屏与直播工具，适合课程录制、桌面演示和直播推流。',
    category: '录屏直播',
    license: '开源',
    platforms: ['Windows', 'macOS', 'Linux'],
    homepage: 'https://obsproject.com/',
    sourceUrl: 'https://github.com/obsproject/obs-studio',
    cloudLinks: [],
    highlights: ['录屏与直播一体', '支持多场景切换', '插件生态丰富'],
    description:
      'OBS Studio 是录屏和直播领域的常用开源工具。它可以录制桌面、窗口、摄像头和麦克风，也能配置多场景工作流。',
    useCases: ['录制软件教程', '直播推流', '会议或课程留档'],
  },
  {
    slug: 'vlc',
    name: 'VLC media player',
    summary: '免费开源播放器，支持大量音视频格式，适合作为系统默认播放器。',
    category: '影音播放',
    license: '开源',
    platforms: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'],
    homepage: 'https://www.videolan.org/vlc/',
    sourceUrl: 'https://code.videolan.org/videolan/vlc',
    cloudLinks: [],
    highlights: ['格式兼容性强', '跨平台', '无需额外解码包'],
    description:
      'VLC 是兼容性很强的播放器，适合打开各种来源的视频和音频文件。对普通用户来说，它最大的价值是省心。',
    useCases: ['播放本地视频', '打开不常见格式文件', '临时检查音视频素材'],
  },
  {
    slug: 'sumatrapdf',
    name: 'SumatraPDF',
    summary: '轻量 PDF 阅读器，启动快，占用低，也支持 epub、mobi、cbz 等格式。',
    category: '文档阅读',
    license: '开源',
    platforms: ['Windows'],
    homepage: 'https://www.sumatrapdfreader.org/free-pdf-reader',
    sourceUrl: 'https://github.com/sumatrapdfreader/sumatrapdf',
    cloudLinks: [],
    highlights: ['启动速度快', '界面简洁', '支持多种阅读格式'],
    description:
      'SumatraPDF 适合只想快速打开和阅读文档的用户。它不追求复杂编辑能力，优势是轻、快、干净。',
    useCases: ['快速阅读 PDF', '打开电子书文件', '替代笨重阅读器'],
  },
  {
    slug: 'sharex',
    name: 'ShareX',
    summary: '开源截图、录屏与自动化分享工具，功能强但需要一点配置。',
    category: '截图录屏',
    license: '开源',
    platforms: ['Windows'],
    homepage: 'https://getsharex.com/',
    sourceUrl: 'https://github.com/ShareX/ShareX',
    cloudLinks: [],
    highlights: ['截图方式丰富', '支持 GIF/录屏', '可配置自动化流程'],
    description:
      'ShareX 不只是截图工具，也能录屏、识别区域、加标注并自动保存。适合经常做教程、反馈问题和整理素材的人。',
    useCases: ['截图标注', '录制短 GIF', '批量保存截图素材'],
  },
  {
    slug: 'iptvnator',
    name: 'IPTVnator',
    summary: '跨平台 IPTV 播放器，适合在电脑上导入 M3U/M3U8 直播源并管理频道列表。',
    category: '影音播放',
    license: '开源',
    platforms: ['Windows', 'macOS', 'Linux'],
    homepage: 'https://github.com/4gray/iptvnator/releases/latest',
    sourceUrl: 'https://github.com/4gray/iptvnator',
    cloudLinks: [],
    highlights: ['支持 M3U/M3U8 播放列表', '支持频道分组、搜索和收藏', '可配置 EPG 节目单'],
    description:
      'IPTVnator 是面向桌面端的 IPTV 播放器，适合把公开 M3U 直播源导入后按频道列表观看。相比 VLC，它更适合长期管理频道、分组和节目单。',
    useCases: ['在电脑上观看 M3U 直播源', '管理 CCTV 或中文频道列表', '给直播源配置 EPG 节目单'],
  },
  {
    slug: 'tivimate',
    name: 'TiviMate',
    summary: 'Android TV / 电视盒子上常用的 IPTV 播放器，适合遥控器操作和长期观看直播源。',
    category: '影音播放',
    license: '免费',
    platforms: ['Android TV', 'Google TV'],
    homepage: 'https://tivimate.com/',
    cloudLinks: [],
    highlights: ['适合电视和盒子遥控器操作', '支持 M3U 播放列表', '频道管理体验较好'],
    description:
      'TiviMate 是偏电视端体验的 IPTV 播放器，适合在 Android TV、Google TV 或电视盒子上添加 M3U 直播源。它不是开源软件，基础功能可用，部分高级能力需要付费解锁。',
    useCases: ['在电视盒子上添加 IPTV 源', '用遥控器浏览频道列表', '长期观看和管理直播频道'],
  },
]

export function getDownloadTool(slug: string): DownloadTool | undefined {
  return downloadTools.find(tool => tool.slug === slug)
}

export function getDownloadCategories(): string[] {
  return Array.from(new Set(downloadTools.map(tool => tool.category)))
}
