const mongoose = require('mongoose');
const { Schema } = mongoose;
const { addressSchema, noteSchema } = require('./schemas/common');

/* ============================
   STUDENT SCHEMA
============================ */
const StudentSchema = new Schema(
  {
    /* ---------- MEMBER ID ---------- */
    memberId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    /* ---------- BASIC FLAGS ---------- */
    isStudent: { type: Boolean, default: true, immutable: true },
    //isSubprofile: { type: Boolean, default: false },
    primaryStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        default: null
        },

        subprofileIds: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        }
        ],

        isSubprofile: {
        type: Boolean,
        default: false,
        index: true
        },

    /* ---------- OPTIONAL LINK TO MEMBER ---------- */
    memberRef: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: false
    },

    /* ---------- BASIC INFO ---------- */
    name: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    secondaryPhone: String,
    dob: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    bloodGroup: String,

    /* ---------- ADDRESS ---------- */
    address: [addressSchema],

    /* ---------- STUDENT DETAILS ---------- */
    studentDetails: {
      schoolId: {
        type: String,
        ref: 'School',
        required: true,
        index: true
      },
      schoolName: String,
      grade: {
        type: String,
        required: true,
        index: true
      },
      section: {
        type: String,
        required: true,
        index: true
      },
      guardians: [
        {
          name: String,
          relation: {
            type: String,
            enum: ['father', 'mother', 'guardian']
          },
          phone: String
        }
      ],
      alternatePhone: Number
    },

    /* ---------- EMERGENCY ---------- */
    emergencyContact: {
      name: String,
      relation: {
        type: String,
        enum: ['father', 'mother', 'guardian', 'other']
      },
      phone: String
    },

    /* ---------- MEMBERSHIP ---------- */
    isMember: { type: Boolean, default: true },
    membershipStatus: {
      isRegistered: { type: Boolean, default: false },
      registrationDate: Date,
      hasOneTimeRegistrationDiscount: { type: Boolean, default: false },
      premiumMembership: {
        isActive: { type: Boolean, default: false },
        startDate: Date,
        expiryDate: Date,
        renewalCount: { type: Number, default: 0 }
      }
    },

    /* ---------- SYSTEM ---------- */
    termsConditionsAccepted: { type: Boolean, default: false },
    onBoarded: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    notes: [noteSchema]
  },
  { timestamps: true }
);

/* ============================
   MEMBER ID GENERATION LOGIC
   (Copied & ALIGNED with Member.model.js)
============================ */
StudentSchema.pre('save', async function (next) {
  if (!this.memberId && this.isMember === true) {
    const lastStudent = await this.constructor.findOne(
      {},
      { memberId: 1 },
      { sort: { memberId: -1 } }
    );

    if (!lastStudent || !lastStudent.memberId) {
      this.memberId = 'AAA00';
    } else {
      const prefix = lastStudent.memberId.slice(0, 3);
      const num = parseInt(lastStudent.memberId.slice(3), 10);

      if (num < 99) {
        this.memberId = `${prefix}${String(num + 1).padStart(2, '0')}`;
      } else {
        const lastChar = prefix.charAt(2);
        const newLastChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
        this.memberId = `${prefix.slice(0, 2)}${newLastChar}00`;
      }
    }
  }
  next();
});

/* ============================
   INDEXES (FOR LIST & FILTER)
============================ */
StudentSchema.index({ phone: 1 });
StudentSchema.index({ email: 1 });
StudentSchema.index({
  'studentDetails.schoolId': 1,
  'studentDetails.grade': 1,
  'studentDetails.section': 1,
  createdAt: -1
});

module.exports = mongoose.model('Student', StudentSchema);
