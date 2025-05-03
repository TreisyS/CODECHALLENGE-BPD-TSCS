import {Schema, model, Document} from 'mongoose';
import { Person } from './person.types';


export interface IPerson extends Person, Document{}
const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
const formatTlf = /^\d{10,12}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PersonSchema = new Schema<IPerson>(
    {
        firstName: { type: String, required: true, trim: true, minlength:2, maxlength:40, match:nameRegex },
        lastName: { type: String, required: true, trim:true, minlength:2, maxlength:40, match:nameRegex  },
        cellphone: { type: String, required: true, trim:true, match: formatTlf},
        countryCode: {type:String, required:true, uppercase:true, match: /^[A-Z]{2}$/ },
        email: { type: String, required: true, trim:true, unique:true, lowercase:true, match:emailRegex, minlength:2, maxlength:40 },
        address: { type: String, required: true, trim:true, minlength:5, maxlength:150  },
        estado: { type: String, enum: ['activo', 'inactivo', 'pendiente'],  default: 'activo'},
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        createdBy: { type: String, required: true },
        updatedBy: { type: String, required: true },
        updateAt: { type: Date, default: null },
    },
    {
        timestamps:true,
        versionKey:false
    }
);
// Indexes for the Person model
PersonSchema.index({ firstName: 1 });
PersonSchema.index({ lastName: 1 });
PersonSchema.index({ estado: 1 });
PersonSchema.index({ createdAt: -1 });
PersonSchema.index({ isDeleted: 1 });


export default model <IPerson>('Person', PersonSchema);