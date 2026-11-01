import { Schema, model } from 'mongoose';
import type { ValuationDossier } from '../../types/dossier';

const DOSSIER_STATUS_VALUES = [
  'MOI_GIAO',
  'KHACH_HANG_HUY',
  'DA_HEN_LICH_KHAO_SAT',
  'DA_KHAO_SAT',
  'KHACH_HANG_CHUA_THANH_TOAN',
  'KHACH_HANG_DA_THANH_TOAN',
  'DA_LEN_BAO_CAO_CHO_DUYET',
  'DA_DUYET_BAO_CAO',
  'DA_GUI_BAO_CAO_CHO_CHI_NHANH',
  'DA_GUI_HO_SO_BAN_CUNG_CHO_CHI_NHANH',
  'TU_CHOI_BAO_CAO',
];

const ASSET_CATEGORY_VALUES = [
  'DAT_VA_TAI_SAN_GAN_LIEN_VOI_DAT',
  'CAN_HO_CHUNG_CU',
  'PHUONG_TIEN_VAN_TAI',
  'MAY_MOC_THIET_BI',
];

const VALUATION_PURPOSE_VALUES = [
  'VAY_VON_NGAN_HANG',
  'MUA_BAN_SAP_NHAP',
  'BAO_CAO_TAI_CHINH',
  'THI_HANH_AN',
  'KHAC',
];

const PAYMENT_STATUS_VALUES = ['CHUA_THANH_TOAN', 'DA_TAM_UNG', 'DA_THANH_TOAN'];

const DOSSIER_PRIORITY_VALUES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const LegalDocumentSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['DA_NOP', 'CHUA_NOP', 'CAN_BO_SUNG'], required: true },
    note: String,
  },
  { _id: false }
);

const StatusHistoryItemSchema = new Schema(
  {
    status: { type: String, enum: DOSSIER_STATUS_VALUES, required: true },
    note: { type: String, required: true },
    updatedAt: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { _id: false }
);

const MarketComparableSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    source: { type: String, required: true },
    contactPhone: String,
    surveyDate: String,
    address: String,
    area: { type: Number, required: true },
    floorsOrFloorLevel: String,
    direction: String,
    legalStatus: String,
    askingPrice: { type: Number, required: true },
    askingUnitPrice: Number,
    negotiationRate: Number,
    transactionUnitPrice: Number,
    adjustmentRate: Number,
    adjustedUnitPrice: { type: Number, required: true },
    notes: String,
  },
  { _id: false }
);

const BuildingComponentQualitySchema = new Schema(
  {
    id: { type: String, required: true },
    componentName: { type: String, required: true },
    weightRate: { type: Number, required: true },
    actualQualityRate: { type: Number, required: true },
    weightedQuality: { type: Number, required: true },
    conditionDescription: String,
  },
  { _id: false }
);

const ClclCalculationSheetSchema = new Schema(
  {
    buildingClassification: String,
    designLifespanYears: Number,
    constructionYear: Number,
    appraisalYear: Number,
    usedYears: Number,
    baseDepreciationRate: Number,
    components: [BuildingComponentQualitySchema],
    finalClclRate: Number,
    newConstructionUnitPrice: Number,
    usableFloorArea: Number,
    newReplacementValue: Number,
    remainingStructureValue: Number,
  },
  { _id: false }
);

const LandPlanningValuationRowSchema = new Schema(
  {
    landType: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
    notes: String,
  },
  { _id: false }
);

const LandPlanningValuationSchema = new Schema(
  {
    plannedArea: { type: LandPlanningValuationRowSchema, required: true },
    unplannedArea: { type: LandPlanningValuationRowSchema, required: true },
    totalQuantity: Number,
    totalPrice: Number,
  },
  { _id: false }
);

const dossierSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true },
    status: { type: String, enum: DOSSIER_STATUS_VALUES, required: true },
    businessUnit: String,
    clientName: { type: String, required: true },
    clientCccd: String,
    clientPhone: String,
    clientEmail: String,
    clientAddress: String,
    receivedDate: { type: String, required: true },
    receivedTime: String,
    assignedDate: String,
    assignedTime: String,
    amcSpecialist: String,
    advanceFee: Number,
    surveyDate: String,
    surveyTime: String,
    approvalDate: String,
    businessUnitSpecialist: String,
    creditOfficer: String,
    totalValuationFee: Number,

    assetName: { type: String, required: true },
    assetCategory: { type: String, enum: ASSET_CATEGORY_VALUES, required: true },
    assetAddress: { type: String, required: true },

    landPlotNumber: String,
    mapSheetNumber: String,
    apartmentNumber: String,
    buildingName: String,
    houseNumber: String,
    ward: String,
    district: String,
    province: String,

    constructionYear: String,
    floorsCount: String,
    areaCertificate: Number,
    areaExpanded: Number,
    landUseForm: String,
    landUsePurpose: String,
    landUseTerm: String,
    roadAccessLevel: String,
    roadType: String,
    roadWidth: String,
    direction: String,
    shape: String,
    frontageWidth: Number,
    dimension: String,
    businessCondition: String,
    infrastructure: String,
    carQuality: Number,
    licensePlate: String,
    chassisNumber: String,
    engineNumber: String,
    manufactureYear: Schema.Types.Mixed,
    apartmentFloor: Schema.Types.Mixed,
    otherFactors: String,
    googleMapCoords: String,

    stateLandPrice: Number,
    statePriceYear: String,
    kCoefficient: Number,
    proposedUnitPrice: Number,
    appraisedUnitPrice: Number,
    marketPrice: Number,

    plannedLandUnit: String,
    plannedLandArea: Number,
    plannedLandUnitPrice: Number,
    plannedLandValue: Number,
    unplannedLandUnit: String,
    unplannedLandArea: Number,
    unplannedLandUnitPrice: Number,
    unplannedLandValue: Number,
    landPlanningValuation: LandPlanningValuationSchema,

    constructionType: String,
    constructionArea: Number,
    constructionUsableArea: Number,
    constructionActualArea: Number,
    buildingFloorsMaterial: String,
    buildingYear: String,
    remainingBuildingQuality: Number,
    constructionUnitPrice: Number,

    area: Number,
    legalDocNumber: String,
    purpose: { type: String, enum: VALUATION_PURPOSE_VALUES },
    dueDate: String,
    completedDate: String,
    assignedAppraiser: String,
    branch: String,
    estimatedValue: Number,
    approvedValue: Number,
    serviceFee: Number,
    paymentStatus: { type: String, enum: PAYMENT_STATUS_VALUES },
    priority: { type: String, enum: DOSSIER_PRIORITY_VALUES },
    methodUsed: String,
    notes: String,
    assetImages: [String],
    documents: [LegalDocumentSchema],
    statusHistory: [StatusHistoryItemSchema],
    approvalRejectionReason: String,
    submittedForApprovalAt: String,
    submissionNote: String,
    approvedAt: String,
    approvedBy: String,

    creditProposal: String,
    maxLtvRate: Number,
    maxLoanAmount: Number,
    collateralConditions: String,
    postDisbursementCheck: String,
    otherProposals: String,
    recommendations: String,

    marketComparables: [MarketComparableSchema],
    clclCalculation: ClclCalculationSheetSchema,
    landValuationTable: { type: Schema.Types.Mixed, default: undefined },

    importedColumnsData: { type: Schema.Types.Mixed, default: undefined },
    customFields: { type: Schema.Types.Mixed, default: undefined },
    totalImportedColumns: Number,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export const DossierModel = model<ValuationDossier>('Dossier', dossierSchema);
