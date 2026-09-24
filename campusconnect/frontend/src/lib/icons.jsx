import {
  LuShieldCheck, LuBadgeCheck, LuSearch, LuSlidersHorizontal, LuBell, LuBellOff, LuHeart, LuBookmark, LuMessageCircle, LuSend, LuPlus, LuX, LuChevronLeft, LuChevronRight, LuChevronDown, LuChevronUp,
  LuQrCode, LuScanLine, LuRepeat, LuTag, LuGift, LuBookOpen, LuFlaskConical, LuCalculator, LuBike, LuGuitar, LuCpu, LuLaptop, LuCamera, LuImage, LuUpload, LuCrop, LuCheck, LuCheckCheck,
  LuClock, LuMapPin, LuStar, LuTrendingUp, LuLeaf, LuRecycle, LuWallet, LuCoins, LuGraduationCap, LuUsers, LuUser, LuHouse, LuLayoutGrid, LuSettings, LuMoon, LuSun, LuLogOut, LuShare2,
  LuEllipsis, LuPaperclip, LuMic, LuSmile, LuPhone, LuVideo, LuSparkles, LuBot, LuArrowRight, LuArrowLeft, LuArrowUpRight, LuInfo, LuTriangleAlert, LuLock, LuKey, LuMail, LuTrophy, LuMedal,
  LuFlame, LuLightbulb, LuBriefcase, LuPlay, LuPause, LuDownload, LuCopy, LuTrash2, LuPencil, LuEye, LuMessageSquare, LuHandshake, LuPackageCheck, LuPackage, LuTimer, LuCalendar,
  LuCalendarDays, LuFileText, LuNotebookPen, LuMusic, LuPalette, LuCode, LuLanguages, LuShirt, LuGlasses, LuRuler, LuPenTool, LuReply, LuCircleCheck, LuShieldAlert, LuZap, LuWandSparkles,
  LuBuilding2, LuPin, LuVolume2, LuGlobe, LuLink, LuSmartphone, LuArrowLeftRight, LuRotateCcw, LuFingerprint, LuThumbsUp, LuAward, LuRocket, LuTarget, LuCloudUpload, LuImagePlus, LuLayers,
  LuCircle, LuPercent, LuLibrary, LuClipboardCheck, LuListFilter, LuNewspaper, LuTreePine, LuMicroscope, LuMaximize2, LuZoomIn, LuFootprints, LuMessagesSquare, LuHash, LuSwitchCamera,
} from "react-icons/lu";

const MAP = {
  shield: LuShieldCheck, verified: LuBadgeCheck, search: LuSearch, sliders: LuSlidersHorizontal, bell: LuBell, bellOff: LuBellOff, heart: LuHeart, bookmark: LuBookmark, comment: LuMessageCircle, send: LuSend,
  plus: LuPlus, x: LuX, back: LuChevronLeft, next: LuChevronRight, down: LuChevronDown, up: LuChevronUp, qr: LuQrCode, scan: LuScanLine, repeat: LuRepeat, tag: LuTag, gift: LuGift, book: LuBookOpen,
  flask: LuFlaskConical, calc: LuCalculator, bike: LuBike, guitar: LuGuitar, cpu: LuCpu, laptop: LuLaptop, camera: LuCamera, image: LuImage, upload: LuUpload, crop: LuCrop, check: LuCheck, checks: LuCheckCheck,
  clock: LuClock, pin: LuMapPin, star: LuStar, trend: LuTrendingUp, leaf: LuLeaf, recycle: LuRecycle, wallet: LuWallet, coins: LuCoins, grad: LuGraduationCap, users: LuUsers, user: LuUser, home: LuHouse,
  grid: LuLayoutGrid, settings: LuSettings, moon: LuMoon, sun: LuSun, logout: LuLogOut, share: LuShare2, more: LuEllipsis, clip: LuPaperclip, mic: LuMic, smile: LuSmile, phone: LuPhone, video: LuVideo,
  sparkles: LuSparkles, bot: LuBot, arrow: LuArrowRight, arrowL: LuArrowLeft, arrowUR: LuArrowUpRight, info: LuInfo, warn: LuTriangleAlert, lock: LuLock, key: LuKey, mail: LuMail, trophy: LuTrophy,
  medal: LuMedal, flame: LuFlame, bulb: LuLightbulb, briefcase: LuBriefcase, play: LuPlay, pause: LuPause, download: LuDownload, copy: LuCopy, trash: LuTrash2, edit: LuPencil, eye: LuEye, msg: LuMessageSquare,
  handshake: LuHandshake, packageOk: LuPackageCheck, package: LuPackage, timer: LuTimer, calendar: LuCalendar, days: LuCalendarDays, file: LuFileText, notes: LuNotebookPen, music: LuMusic, palette: LuPalette,
  code: LuCode, lang: LuLanguages, coat: LuShirt, goggles: LuGlasses, ruler: LuRuler, pen: LuPenTool, reply: LuReply, ok: LuCircleCheck, alert: LuShieldAlert, zap: LuWandSparkles, bolt: LuZap,
  building: LuBuilding2, pinned: LuPin, volume: LuVolume2, globe: LuGlobe, link: LuLink, phoneS: LuSmartphone, swap: LuArrowLeftRight, undo: LuRotateCcw, finger: LuFingerprint, thumb: LuThumbsUp, award: LuAward,
  rocket: LuRocket, target: LuTarget, cloudUp: LuCloudUpload, addImage: LuImagePlus, layers: LuLayers, dot: LuCircle, percent: LuPercent, library: LuLibrary, clipOk: LuClipboardCheck, filter: LuListFilter,
  news: LuNewspaper, tree: LuTreePine, micro: LuMicroscope, max: LuMaximize2, zoom: LuZoomIn, foot: LuFootprints, chats: LuMessagesSquare, hash: LuHash, flip: LuSwitchCamera,
};

export function Icon({ name, size, className, style, ...rest }) {
  const C = MAP[name] || LuCircle;
  return <C className={className} style={size ? { width: size, height: size, ...style } : style} aria-hidden="true" {...rest} />;
}
export const CAT_ICON = { books: "book", lab: "flask", tech: "cpu", cycles: "bike", music: "music", notes: "notes" };
export const MODE_ICON = { LEND: "repeat", SELL: "tag", DONATE: "gift" };
