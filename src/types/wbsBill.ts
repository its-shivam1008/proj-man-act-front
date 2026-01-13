export interface Bill {
  _id: string;
  wbsId: string;

  gstWithheld: number;
  retentionWithheld: number;
  totalAmount: number;
  amountReceived: number;

  maturityDate: string;

  billImage?: {
    url: string;
    public_id: string;
  };

  createdAt: string;
}
