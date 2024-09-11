import * as ExcelJS from 'exceljs';
import { getTeams } from './firestore-service';

export async function generateExcel(date: Date) {
  const teams = await getTeams();

  const teamMealMap: { [key: string]: { mealsForDate: number; restaurant: string } } = {};

  teams.forEach((team) => {
    const mealsForDate = team.meals[date.toISOString()] || 0;
    const restaurant = team.restaurant || 'Not selected';
    teamMealMap[team.name] = { mealsForDate, restaurant };
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(date.toDateString());

  worksheet.columns = [
    { header: 'Country', key: 'name', width: 10 },
    { header: 'Number of meals', key: 'mealsForDate', width: 32 },
    { header: 'Eating place', key: 'restaurant', width: 20 }
  ];

  for (const [name, data] of Object.entries(teamMealMap)) {
    worksheet.addRow({
      name,
      mealsForDate: data.mealsForDate,
      restaurant: data.restaurant
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${date.getUTCMilliseconds()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return;
}
