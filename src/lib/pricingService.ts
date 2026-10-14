import { Property, Booking, DateOverride } from '../types';

/**
 * Calculates the dynamic unit price for a given property, section, and date.
 * For merged units (resort-combo-1 and resort-combo-2), it automatically sums
 * the current prices from both underlying units' calendars (including any date overrides).
 */
export function getResolvedDatePrice(
  propertyId: string,
  sectionId: string | undefined | null,
  dateKey: string,
  dateOverrides: Record<string, DateOverride>,
  properties: Property[]
): number {
  const dateObj = new Date(dateKey);
  const isWeekend = dateObj.getDay() === 4 || dateObj.getDay() === 5; // Thursday & Friday

  // Direct explicit override on this exact property + section + date
  const directKey = sectionId && sectionId !== 'all'
    ? `${propertyId}_${sectionId}_${dateKey}`
    : `${propertyId}_${dateKey}`;
  if (dateOverrides[directKey]?.price !== undefined) {
    return dateOverrides[directKey].price!;
  }

  // Handle "منتجع الترف" units (Merged combos)
  if (propertyId === 'montaja-al-taraf') {
    // 1. كوخ البيلسان والترف -(قسم واحد): يجمع سعر البيلسان + سعر الترف (قسم واحد)
    if (sectionId === 'resort-combo-1') {
      const baylasanPrice = getResolvedDatePrice('al-baylasan', undefined, dateKey, dateOverrides, properties);
      const tarafSection1Price = getResolvedDatePrice('al-taraf', 'section-1', dateKey, dateOverrides, properties);
      return baylasanPrice + tarafSection1Price;
    }

    // 2. كوخ البيلسان والترف -(قسمين): يجمع سعر البيلسان + سعر الترف (كامل القسمين)
    if (sectionId === 'resort-combo-2') {
      const baylasanPrice = getResolvedDatePrice('al-baylasan', undefined, dateKey, dateOverrides, properties);
      const tarafPrice = getResolvedDatePrice('al-taraf', 'section-2', dateKey, dateOverrides, properties);
      return baylasanPrice + tarafPrice;
    }
  }

  // Default calculation based on property or section base pricing
  const prop = properties.find((p) => p.id === propertyId);
  if (!prop) return 1000;

  if (sectionId && sectionId !== 'all') {
    const sec = prop.sections?.find((s) => s.id === sectionId);
    if (sec) {
      return isWeekend ? sec.priceWeekend : sec.priceWeekday;
    }
  }

  return isWeekend ? prop.basePriceWeekend : prop.basePriceWeekday;
}

/**
 * Checks if a unit or property is booked on a date, cross-checking
 * between the parent resort and the child units to strictly prevent double-booking.
 */
export function isDateBookedCrossProperty(
  propertyId: string,
  sectionId: string | undefined | null,
  dateKey: string,
  bookings: Booking[]
): { isBooked: boolean; matchedBooking?: Booking } {
  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && dateKey >= b.checkInDate && dateKey < b.checkOutDate
  );

  // 1. Direct match on property and section
  const directMatch = activeBookings.find(
    (b) =>
      b.propertyId === propertyId &&
      (!sectionId || sectionId === 'all' || !b.sectionId || b.sectionId === sectionId)
  );
  if (directMatch) return { isBooked: true, matchedBooking: directMatch };

  // 2. If checking "منتجع الترف" units
  // 2. If checking "منتجع الترف" units (resort combos)
  if (propertyId === 'montaja-al-taraf') {
    if (sectionId === 'resort-combo-1') {
      // Combo-1 requires al-baylasan and al-taraf (section-1)
      const match = activeBookings.find(
        (b) =>
          b.propertyId === 'al-baylasan' ||
          (b.propertyId === 'al-taraf' && (!b.sectionId || b.sectionId === 'section-1' || b.sectionId === 'section-2')) ||
          (b.propertyId === 'montaja-al-taraf' &&
            (!b.sectionId || b.sectionId === 'resort-combo-1' || b.sectionId === 'resort-combo-2'))
      );
      if (match) return { isBooked: true, matchedBooking: match };
    } else if (sectionId === 'resort-combo-2') {
      // Combo-2 requires al-baylasan and full al-taraf
      const match = activeBookings.find(
        (b) =>
          b.propertyId === 'al-baylasan' ||
          b.propertyId === 'al-taraf' ||
          (b.propertyId === 'montaja-al-taraf' &&
            (!b.sectionId || b.sectionId === 'resort-combo-1' || b.sectionId === 'resort-combo-2'))
      );
      if (match) return { isBooked: true, matchedBooking: match };
    }
  }

  // 3. If checking standalone "الترف"
  if (propertyId === 'al-taraf') {
    const match = activeBookings.find(
      (b) =>
        b.propertyId === 'al-taraf' ||
        (b.propertyId === 'montaja-al-taraf' &&
          (b.sectionId === 'resort-combo-1' || b.sectionId === 'resort-combo-2'))
    );
    if (match) return { isBooked: true, matchedBooking: match };
  }

  // 4. If checking standalone "كوخ البيلسان"
  if (propertyId === 'al-baylasan') {
    const match = activeBookings.find(
      (b) =>
        b.propertyId === 'al-baylasan' ||
        (b.propertyId === 'montaja-al-taraf' &&
          (b.sectionId === 'resort-combo-1' || b.sectionId === 'resort-combo-2'))
    );
    if (match) return { isBooked: true, matchedBooking: match };
  }

  return { isBooked: false };
}

/**
 * Checks if a unit or property is blocked or waiting deposit, cross-checking
 * between the parent resort and child units.
 */
export function isDateBlockedCrossProperty(
  propertyId: string,
  sectionId: string | undefined | null,
  dateKey: string,
  dateOverrides: Record<string, DateOverride>
): { isBlocked: boolean; isWaitingDeposit: boolean; waitingDepositExpiresAt?: number } {
  const directKey = sectionId && sectionId !== 'all'
    ? `${propertyId}_${sectionId}_${dateKey}`
    : `${propertyId}_${dateKey}`;
  const directOv = dateOverrides[directKey] || dateOverrides[`${propertyId}_${dateKey}`];

  if (directOv?.status === 'blocked') {
    return { isBlocked: true, isWaitingDeposit: false };
  }
  if (directOv?.status === 'waiting_deposit') {
    return {
      isBlocked: false,
      isWaitingDeposit: true,
      waitingDepositExpiresAt: directOv.waitingDepositExpiresAt,
    };
  }

  const baylasanOv =
    dateOverrides[`montaja-al-taraf_resort-baylasan_${dateKey}`] ||
    dateOverrides[`al-baylasan_${dateKey}`];
  const tarafOv =
    dateOverrides[`montaja-al-taraf_resort-taraf_${dateKey}`] ||
    dateOverrides[`al-taraf_section-2_${dateKey}`] ||
    dateOverrides[`al-taraf_section-1_${dateKey}`] ||
    dateOverrides[`al-taraf_${dateKey}`];
  const combo1Ov = dateOverrides[`montaja-al-taraf_resort-combo-1_${dateKey}`];
  const combo2Ov = dateOverrides[`montaja-al-taraf_resort-combo-2_${dateKey}`];

  if (propertyId === 'montaja-al-taraf') {
    if (sectionId === 'resort-combo-1' || sectionId === 'resort-combo-2') {
      if (
        combo1Ov?.status === 'blocked' ||
        combo2Ov?.status === 'blocked' ||
        baylasanOv?.status === 'blocked' ||
        tarafOv?.status === 'blocked'
      ) {
        return { isBlocked: true, isWaitingDeposit: false };
      }
      if (combo1Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo1Ov.waitingDepositExpiresAt };
      }
      if (combo2Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo2Ov.waitingDepositExpiresAt };
      }
      if (baylasanOv?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: baylasanOv.waitingDepositExpiresAt };
      }
      if (tarafOv?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: tarafOv.waitingDepositExpiresAt };
      }
    } else if (sectionId === 'resort-baylasan') {
      if (baylasanOv?.status === 'blocked' || combo1Ov?.status === 'blocked' || combo2Ov?.status === 'blocked') {
        return { isBlocked: true, isWaitingDeposit: false };
      }
      if (baylasanOv?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: baylasanOv.waitingDepositExpiresAt };
      }
      if (combo1Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo1Ov.waitingDepositExpiresAt };
      }
      if (combo2Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo2Ov.waitingDepositExpiresAt };
      }
    } else if (sectionId === 'resort-taraf') {
      if (tarafOv?.status === 'blocked' || combo1Ov?.status === 'blocked' || combo2Ov?.status === 'blocked') {
        return { isBlocked: true, isWaitingDeposit: false };
      }
      if (tarafOv?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: tarafOv.waitingDepositExpiresAt };
      }
      if (combo1Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo1Ov.waitingDepositExpiresAt };
      }
      if (combo2Ov?.status === 'waiting_deposit') {
        return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo2Ov.waitingDepositExpiresAt };
      }
    }
  }

  // Cross-blocking for standalone al-taraf
  if (propertyId === 'al-taraf') {
    if (tarafOv?.status === 'blocked' || combo1Ov?.status === 'blocked' || combo2Ov?.status === 'blocked') {
      return { isBlocked: true, isWaitingDeposit: false };
    }
    if (tarafOv?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: tarafOv.waitingDepositExpiresAt };
    }
    if (combo1Ov?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo1Ov.waitingDepositExpiresAt };
    }
    if (combo2Ov?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo2Ov.waitingDepositExpiresAt };
    }
  }

  // Cross-blocking for standalone al-baylasan
  if (propertyId === 'al-baylasan') {
    if (baylasanOv?.status === 'blocked' || combo1Ov?.status === 'blocked' || combo2Ov?.status === 'blocked') {
      return { isBlocked: true, isWaitingDeposit: false };
    }
    if (baylasanOv?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: baylasanOv.waitingDepositExpiresAt };
    }
    if (combo1Ov?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo1Ov.waitingDepositExpiresAt };
    }
    if (combo2Ov?.status === 'waiting_deposit') {
      return { isBlocked: false, isWaitingDeposit: true, waitingDepositExpiresAt: combo2Ov.waitingDepositExpiresAt };
    }
  }

  return { isBlocked: false, isWaitingDeposit: false };
}
