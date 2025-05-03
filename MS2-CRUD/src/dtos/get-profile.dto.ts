

export interface GetProfileQuery {
    search?: string;
    estado?: 'activo' | 'inactivo' | 'pendiente';
    page?: number;
    limit?: number;
    sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }
  