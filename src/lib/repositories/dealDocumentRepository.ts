import { eq } from 'drizzle-orm';
import { dealDocuments } from '@/lib/db/schema';
import type { DbClient, Tables, TablesInsert } from './types';

export class DealDocumentRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Tables<'deal_documents'>> {
    const [row] = await this.db
      .select()
      .from(dealDocuments)
      .where(eq(dealDocuments.id, id))
      .limit(1);
    if (!row) throw new Error(`Deal document ${id} not found`);
    return row;
  }

  async findPathAndNameById(
    id: string,
  ): Promise<Pick<Tables<'deal_documents'>, 'file_path' | 'file_name'>> {
    const [row] = await this.db
      .select({ file_path: dealDocuments.file_path, file_name: dealDocuments.file_name })
      .from(dealDocuments)
      .where(eq(dealDocuments.id, id))
      .limit(1);
    if (!row) throw new Error(`Deal document ${id} not found`);
    return row;
  }

  async findFilePathsByDealId(dealId: string): Promise<string[]> {
    const rows = await this.db
      .select({ file_path: dealDocuments.file_path })
      .from(dealDocuments)
      .where(eq(dealDocuments.deal_id, dealId));
    return rows.map((d) => d.file_path).filter(Boolean);
  }

  async insert(data: TablesInsert<'deal_documents'>): Promise<void> {
    await this.db.insert(dealDocuments).values(data);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(dealDocuments).where(eq(dealDocuments.id, id));
  }
}
