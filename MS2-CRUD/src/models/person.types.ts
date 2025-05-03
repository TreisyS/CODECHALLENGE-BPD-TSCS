export interface Person
    {
        firstName:string;
        lastName:string;
        countryCode:string;
        cellphone:string;
        email:string;
        address:string;
        estado: 'activo' | 'inactivo' | 'pendiente';
        isDeleted: boolean;
        deletedAt?: Date | null;
        createdBy?: string;
        updatedBy?: string;
        updatedAt?: Date | null,
    }