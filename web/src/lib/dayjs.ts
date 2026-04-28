import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

dayjs.locale('pt-br')

export default dayjs
