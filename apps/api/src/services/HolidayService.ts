import { query } from '../db';
import { Holiday, CreateHolidayDTO, UpdateHolidayDTO } from '../models/Holiday';

export class HolidayService {
    async getAllHolidays(): Promise<Holiday[]> {
        const result = await query('SELECT * FROM holidays ORDER BY date ASC');
        return result.rows.map(this.mapRowToHoliday);
    }

    async getHolidaysByRange(startDate: string, endDate: string): Promise<Holiday[]> {
        // Get non-recurring holidays in range
        const result = await query(
            `SELECT * FROM holidays
             WHERE (is_recurring = FALSE AND date >= $1::date AND date <= $2::date)
                OR (is_recurring = TRUE AND (
                    -- Match month/day within the year range
                    TO_CHAR(date, 'MM-DD') >= TO_CHAR($1::date, 'MM-DD')
                    AND TO_CHAR(date, 'MM-DD') <= TO_CHAR($2::date, 'MM-DD')
                ))
             ORDER BY date ASC`,
            [startDate, endDate]
        );
        return result.rows.map(this.mapRowToHoliday);
    }

    async getHolidayDatesSet(startDate: string, endDate: string): Promise<Set<string>> {
        const result = await query(
            `SELECT date, is_recurring FROM holidays
             WHERE (is_recurring = FALSE AND date >= $1::date AND date <= $2::date)
                OR is_recurring = TRUE`,
            [startDate, endDate]
        );

        const targetYear = new Date(startDate).getFullYear();
        const endYear = new Date(endDate).getFullYear();
        const dates = new Set<string>();

        for (const row of result.rows) {
            if (row.is_recurring) {
                const d = new Date(row.date);
                const month = d.getMonth();
                const day = d.getDate();
                // Add for each year in the range
                for (let y = targetYear; y <= endYear; y++) {
                    const dateStr = `${y}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (dateStr >= startDate && dateStr <= endDate) {
                        dates.add(dateStr);
                    }
                }
            } else {
                const d = new Date(row.date);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                dates.add(dateStr);
            }
        }

        return dates;
    }

    async getHolidayById(id: string): Promise<Holiday | null> {
        const result = await query('SELECT * FROM holidays WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        return this.mapRowToHoliday(result.rows[0]);
    }

    async createHoliday(data: CreateHolidayDTO): Promise<Holiday> {
        const result = await query(
            `INSERT INTO holidays (date, name, is_recurring)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [data.date, data.name, data.isRecurring ?? false]
        );
        return this.mapRowToHoliday(result.rows[0]);
    }

    async updateHoliday(id: string, data: UpdateHolidayDTO): Promise<Holiday> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIdx = 1;

        if (data.date !== undefined) {
            fields.push(`date = $${paramIdx++}`);
            values.push(data.date);
        }
        if (data.name !== undefined) {
            fields.push(`name = $${paramIdx++}`);
            values.push(data.name);
        }
        if (data.isRecurring !== undefined) {
            fields.push(`is_recurring = $${paramIdx++}`);
            values.push(data.isRecurring);
        }
        fields.push(`updated_at = NOW()`);
        values.push(id);

        const result = await query(
            `UPDATE holidays SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            const err: any = new Error('Holiday not found');
            err.statusCode = 404;
            throw err;
        }
        return this.mapRowToHoliday(result.rows[0]);
    }

    async deleteHoliday(id: string): Promise<void> {
        const result = await query('DELETE FROM holidays WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            const err: any = new Error('Holiday not found');
            err.statusCode = 404;
            throw err;
        }
    }

    private mapRowToHoliday(row: any): Holiday {
        const d = new Date(row.date);
        return {
            id: row.id,
            date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            name: row.name,
            isRecurring: row.is_recurring,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}

export default new HolidayService();
