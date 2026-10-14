import dayjs from '@/lib/dayjs'

/** Hoje em `YYYY-MM-DD` (as regras de src/lib/kids recebem a data por parâmetro). */
export const kidsToday = () => dayjs().format('YYYY-MM-DD')
